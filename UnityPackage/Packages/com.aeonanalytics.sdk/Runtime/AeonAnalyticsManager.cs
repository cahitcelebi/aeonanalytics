using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using System.Globalization;

namespace AeonAnalytics
{
    public class AeonAnalyticsManager : MonoBehaviour
    {
        public static AeonAnalyticsManager Instance { get; private set; }

        // API Key artık Inspector'dan ayarlanmayacak, Settings asset'inden okunacak.
        private string apiKey;

#if UNITY_EDITOR
        // Geliştirme ortamında (Unity Editor) çalışırken önce localhost, başarısız olursa host.docker.internal dene
        private string backendUrl = "http://localhost:3001";
#else
        // Production build'lerinde canlı backend'e bağlan
        private string backendUrl = "https://api.aeonanalytics.com";
#endif

        [Header("Aeon Analytics Settings")]
        [SerializeField] private bool debugMode = false;

        private string _sessionId;
        private string _userId;
        private bool _isSessionActive = false;
        private DateTime _sessionStartTime;
        private string _userCreatedAt;
        private const string PendingSessionEndKey = "AeonAnalytics_PendingSessionEnd";

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            // API key'i Settings asset'inden yükle
            var settings = Resources.Load<AeonAnalyticsSettingsSO>("AeonAnalyticsSettings");
            if (settings != null && !string.IsNullOrEmpty(settings.apiKey))
            {
                apiKey = settings.apiKey;
                if (debugMode)
                    Debug.Log($"[AeonAnalytics] API Key loaded from Settings: {apiKey}");
            }
            else
            {
                Debug.LogError("[AeonAnalytics] AeonAnalyticsSettings could not be loaded or API Key is empty. Please set it via the menu: Aeon Analytics > Settings.");
            }

            // Pending session end kontrolü
            if (PlayerPrefs.HasKey(PendingSessionEndKey))
            {
                string pendingPayload = PlayerPrefs.GetString(PendingSessionEndKey);
                Debug.Log("[AeonAnalytics] Pending session end bulundu, backend'e gönderiliyor...");
                StartCoroutine(SendPendingSessionEnd(pendingPayload));
            }

            // Kalıcı playerUid ve createdAt
            if (PlayerPrefs.HasKey("AeonAnalytics_playerUid"))
            {
                _userId = PlayerPrefs.GetString("AeonAnalytics_playerUid");
                _userCreatedAt = PlayerPrefs.GetString("AeonAnalytics_playerCreatedAt");
            }
            else
            {
                _userId = Guid.NewGuid().ToString();
                _userCreatedAt = DateTime.UtcNow.ToString("o");
                PlayerPrefs.SetString("AeonAnalytics_playerUid", _userId);
                PlayerPrefs.SetString("AeonAnalytics_playerCreatedAt", _userCreatedAt);
                PlayerPrefs.Save();
            }

            if (string.IsNullOrEmpty(_sessionId))
                _sessionId = Guid.NewGuid().ToString();
        }

        private void Start()
        {
            _sessionStartTime = DateTime.UtcNow;
            _isSessionActive = true;

            // Cihaz bilgilerini topla
            var deviceInfo = GetDeviceInfo();
            var eventData = new Dictionary<string, string> {
                {"playerUid", _userId},
                {"sessionId", _sessionId},
                {"startedAt", DateTime.UtcNow.ToString("o") }
            };
            foreach (var kv in deviceInfo)
                eventData[kv.Key] = kv.Value?.ToString() ?? "unknown";

            // Otomatik olarak bir session başlat ve device/player info'yu event ile gönder
            StartCoroutine(TrackEvent("session_start", "session", eventData));
        }

        private void OnApplicationQuit()
        {
            Debug.Log("[AeonAnalytics] OnApplicationQuit çağrıldı.");
            EndSession();
        }

        private void OnDestroy()
        {
            Debug.Log("[AeonAnalytics] OnDestroy çağrıldı.");
            EndSession();
        }

        private void EndSession()
        {
            if (!_isSessionActive) return;
            Debug.Log("[AeonAnalytics] EndSession çağrıldı.");
            var sessionDuration = (DateTime.UtcNow - _sessionStartTime).TotalSeconds;
            var sessionEvent = new Dictionary<string, object>
            {
                ["eventId"] = Guid.NewGuid().ToString(),
                ["sessionId"] = _sessionId,
                ["playerUid"] = _userId,
                ["playerCreatedAt"] = _userCreatedAt,
                ["deviceId"] = SystemInfo.deviceUniqueIdentifier,
                ["deviceModel"] = SystemInfo.deviceModel,
                ["os"] = SystemInfo.operatingSystem,
                ["eventName"] = "session_end",
                ["eventType"] = "session",
                ["gameId"] = apiKey,
                ["endedAt"] = DateTime.UtcNow.ToString("o"),
                ["durationSeconds"] = sessionDuration.ToString()
            };

            StartCoroutine(SendEvent(sessionEvent));
            SendSessionEndToBackend();
            _isSessionActive = false;
        }

        private void SendSessionEndToBackend()
        {
            if (string.IsNullOrEmpty(apiKey)) return; // API Key yoksa gönderme

            var endTime = DateTime.UtcNow;
            int durationSeconds = (int)(endTime - _sessionStartTime).TotalSeconds;
            string gameVersion = Application.version;
            int timezoneOffsetMinutes = (int)TimeZoneInfo.Local.GetUtcOffset(DateTime.UtcNow).TotalMinutes;

            var payload = new Dictionary<string, object>
            {
                { "session_id", _sessionId },
                { "end_time", endTime.ToString("o") },
                { "duration_seconds", durationSeconds },
                { "game_version", gameVersion },
                { "timezone_offset_minutes", timezoneOffsetMinutes },
                { "game_id", apiKey }
            };

            // PlayerPrefs'e kaydetmek ve backend'e göndermek için manuel JSON çeviriciyi kullan
            string payloadJson = DictionaryToJson(payload);
            PlayerPrefs.SetString(PendingSessionEndKey, payloadJson);
            PlayerPrefs.Save();
            if(debugMode)
                Debug.Log("[AeonAnalytics] Session end payload PlayerPrefs'e kaydedildi: " + payloadJson);

            // Sonra backend'e gönder
            StartCoroutine(SendSessionEndRequest(payloadJson));
        }

        private IEnumerator SendSessionEndRequest(string payloadJson)
        {
            Debug.Log("[AeonAnalytics] SendSessionEndToBackend başladı.");
            string[] urls = { backendUrl, backendUrl.Replace("localhost", "host.docker.internal") };
            bool success = false;
            foreach (var url in urls)
            {
                using (UnityWebRequest www = new UnityWebRequest($"{url}/api/sessions/end", "POST"))
            {
                byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(payloadJson);
                www.uploadHandler = new UploadHandlerRaw(bodyRaw);
                www.downloadHandler = new DownloadHandlerBuffer();
                www.SetRequestHeader("Content-Type", "application/json");
                if (!string.IsNullOrEmpty(apiKey))
                    www.SetRequestHeader("x-api-key", apiKey);
                yield return www.SendWebRequest();
                    if (www.result == UnityWebRequest.Result.Success)
                {
                        success = true;
                        if(debugMode)
                            Debug.Log($"[AeonAnalytics] Session end HTTP isteği gönderildi. Response: {www.downloadHandler.text}");
                        PlayerPrefs.DeleteKey(PendingSessionEndKey);
                        PlayerPrefs.Save();
                        Debug.Log("[AeonAnalytics] Pending session end PlayerPrefs'ten silindi.");
                        break;
                    }
                    else
                    {
                        Debug.LogWarning($"[AeonAnalytics] Session end error: {www.error} | {www.downloadHandler.text} | URL: {url}");
                    }
                }
            }
            if (!success)
            {
                Debug.LogError("[AeonAnalytics] Session end gönderilemedi, tüm URL denemeleri başarısız oldu.");
            }
        }

        private IEnumerator SendPendingSessionEnd(string payloadJson)
        {
            yield return SendSessionEndRequest(payloadJson);
        }

        // Cihaz bilgilerini toplayan yardımcı fonksiyon
        private Dictionary<string, object> GetDeviceInfo()
        {
            string language = Application.systemLanguage.ToString();
            string country = "unknown";
            try {
                country = new RegionInfo(CultureInfo.CurrentCulture.LCID).TwoLetterISORegionName;
            } catch { }
            string osVersion = SystemInfo.operatingSystem;
            string deviceModel = SystemInfo.deviceModel;
            string screenResolution = Screen.currentResolution.width + "x" + Screen.currentResolution.height;
            string platform = Application.platform.ToString();

            return new Dictionary<string, object> {
                { "deviceId", SystemInfo.deviceUniqueIdentifier },
                { "deviceModel", deviceModel },
                { "osVersion", osVersion },
                { "screenResolution", screenResolution },
                { "language", language },
                { "country", country },
                { "platform", platform }
            };
        }

        public IEnumerator TrackEvent(string eventName, string eventType, Dictionary<string, string> extraData = null)
        {
            var payload = new Dictionary<string, object>
            {
                ["eventId"] = Guid.NewGuid().ToString(),
                ["sessionId"] = _sessionId,
                ["playerUid"] = _userId,
                ["playerCreatedAt"] = _userCreatedAt,
                ["gameId"] = apiKey,
                ["eventName"] = eventName,
                ["eventType"] = eventType,
                ["timestamp"] = DateTime.UtcNow.ToString("o")
            };

            // Cihaz bilgilerini ekle
            var deviceInfo = GetDeviceInfo();
            foreach (var kv in deviceInfo)
                payload[kv.Key] = kv.Value;

            if (extraData != null)
            {
                foreach (var kv in extraData)
                    payload[kv.Key] = kv.Value;
            }

            yield return SendEvent(payload);
        }

        // Backend'e istek atan fonksiyonlarda, eğer localhost başarısız olursa host.docker.internal ile tekrar dene
        private IEnumerator SendEvent(Dictionary<string, object> payload)
        {
            string[] urls = { backendUrl, backendUrl.Replace("localhost", "host.docker.internal") };
            string payloadJson = DictionaryToJson(payload);
            string finalJson = $"{{\"events\":[{payloadJson}]}}";
            bool success = false;
            foreach (var url in urls)
            {
                using (UnityWebRequest www = new UnityWebRequest($"{url}/api/events", "POST"))
            {
                byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(finalJson);
                www.uploadHandler = new UploadHandlerRaw(bodyRaw);
                www.downloadHandler = new DownloadHandlerBuffer();
                www.SetRequestHeader("Content-Type", "application/json");
                if (!string.IsNullOrEmpty(apiKey))
                    www.SetRequestHeader("x-api-key", apiKey);
                yield return www.SendWebRequest();
                    if (www.result == UnityWebRequest.Result.Success)
                {
                        success = true;
                        if (debugMode)
                            Debug.Log($"[AeonAnalytics] Success: {www.downloadHandler.text}");
                        break;
                }
                else
                {
                        Debug.LogWarning($"[AeonAnalytics] Error: {www.error} | {www.downloadHandler.text} | URL: {url}");
                    }
                }
            }
            if (!success)
            {
                Debug.LogError("[AeonAnalytics] Event gönderilemedi, tüm URL denemeleri başarısız oldu.");
            }
        }

        // Dictionary<string, object> tipini JSON'a çeviren helper method
        private string DictionaryToJson(Dictionary<string, object> dict)
        {
            var entries = new List<string>();
            foreach (var kv in dict)
            {
                string value;
                if (kv.Value is string s)
                {
                    value = $"\"{s.Replace("\"", "\\\"")}\"";
                }
                else if (kv.Value == null)
                {
                    value = "null";
                }
                else if (kv.Value is bool b)
                {
                    value = b.ToString().ToLower();
                }
                else // Assume number
                {
                    value = Convert.ToString(kv.Value, System.Globalization.CultureInfo.InvariantCulture);
                }
                entries.Add($"\"{kv.Key}\":{value}");
            }
            return "{" + string.Join(",", entries) + "}";
        }
    }
} 