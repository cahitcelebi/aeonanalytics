using UnityEngine;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using UnityEngine.Networking;
using System.Runtime.CompilerServices;
using Newtonsoft.Json;

namespace AeonAnalytics
{
    [DefaultExecutionOrder(-100)]
    public class AeonAnalyticsManager : MonoBehaviour
    {
        private static AeonAnalyticsManager _instance;
        public static AeonAnalyticsManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    var go = new GameObject("AeonAnalyticsManager");
                    _instance = go.AddComponent<AeonAnalyticsManager>();
                    DontDestroyOnLoad(go);
                }
                return _instance;
            }
        }

        [Header("Configuration")]
        [Tooltip("The API key for your game, provided on the Aeon Analytics dashboard.")]
        [SerializeField] private string apiKey;

#if UNITY_EDITOR
        // Geliştirme ortamında (Unity Editor) çalışırken lokal backend'e bağlan
        private string backendUrl = "http://localhost:3001";
#else
        // Production build'lerinde canlı backend'e bağlan
        private string backendUrl = "https://api.aeonanalytics.com";
#endif

        [Header("Aeon Analytics Settings")]
        [SerializeField] private bool debugMode = false;

        public string ApiKey => apiKey;
        public bool DebugMode => debugMode;

        private string _sessionId;
        private string _userId;
        private string _deviceId;
        private DateTime _sessionStartTime;
        private bool _isSessionActive;
        private readonly Queue<Dictionary<string, object>> _eventQueue = new Queue<Dictionary<string, object>>();
        private readonly HttpClient _httpClient = new HttpClient();
        private const int MAX_QUEUE_SIZE = 100;
        private const float FLUSH_INTERVAL = 30f; // Flush events every 30 seconds
        private const string PendingSessionEndKey = "AeonAnalytics_PendingSessionEnd";

        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                Destroy(gameObject);
                return;
            }
            _instance = this;
            DontDestroyOnLoad(gameObject);

            // Pending session end kontrolü
            if (PlayerPrefs.HasKey(PendingSessionEndKey))
            {
                string pendingPayload = PlayerPrefs.GetString(PendingSessionEndKey);
                Debug.Log("[AeonAnalytics] Pending session end bulundu, backend'e gönderiliyor...");
                SendSessionEndToBackend(pendingPayload, true);
            }

            InitializeAnalytics();
        }

        private void InitializeAnalytics()
        {
            _deviceId = SystemInfo.deviceUniqueIdentifier;
            _userId = PlayerPrefs.GetString("AeonAnalytics_UserId", Guid.NewGuid().ToString());
            PlayerPrefs.SetString("AeonAnalytics_UserId", _userId);
            
            StartSession();
            StartCoroutine(PeriodicFlush());
            
            Application.logMessageReceived += HandleLog;
        }

        private void OnDestroy()
        {
            Debug.Log("[AeonAnalytics] OnDestroy çağrıldı.");
            SaveSessionEndToPrefs();
            EndSession();
        }

        private void StartSession()
        {
            _sessionId = Guid.NewGuid().ToString();
            _sessionStartTime = DateTime.UtcNow;
            _isSessionActive = true;

            var sessionEvent = new Dictionary<string, object>
            {
                ["eventId"] = Guid.NewGuid().ToString(),
                ["sessionId"] = _sessionId,
                ["playerUid"] = _userId,
                ["eventName"] = "session_start",
                ["eventType"] = "Session",
                ["timestamp"] = _sessionStartTime,
                ["gameId"] = apiKey,
                ["parameters"] = new Dictionary<string, object>
                {
                    ["platform"] = Application.platform.ToString(),
                    ["app_version"] = Application.version,
                    ["device_model"] = SystemInfo.deviceModel,
                    ["os_version"] = SystemInfo.operatingSystem,
                    ["screen_resolution"] = $"{Screen.width}x{Screen.height}",
                    ["language"] = Application.systemLanguage.ToString(),
                    ["timezone_offset_minutes"] = (int)TimeZoneInfo.Local.GetUtcOffset(DateTime.Now).TotalMinutes
                }
            };

            QueueEvent(sessionEvent);
        }

        private void OnApplicationQuit()
        {
            Debug.Log("[AeonAnalytics] OnApplicationQuit çağrıldı.");
            SaveSessionEndToPrefs();
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
                ["eventName"] = "session_end",
                ["eventType"] = "Session",
                ["timestamp"] = DateTime.UtcNow,
                ["gameId"] = apiKey,
                ["parameters"] = new Dictionary<string, object>
                {
                    ["duration_seconds"] = sessionDuration
                }
            };

            QueueEvent(sessionEvent);
            SendSessionEndToBackend();
            _isSessionActive = false;
            FlushEvents(); // Force flush on session end
        }

        private void SaveSessionEndToPrefs()
        {
            var endTime = DateTime.UtcNow;
            int durationSeconds = (int)(endTime - _sessionStartTime).TotalSeconds;
            string gameVersion = Application.version;
            int timezoneOffsetMinutes = (int)TimeZoneInfo.Local.GetUtcOffset(DateTime.UtcNow).TotalMinutes;

            var payload = new
            {
                session_id = _sessionId,
                end_time = endTime.ToString("o"),
                duration_seconds = durationSeconds,
                game_version = gameVersion,
                timezone_offset_minutes = timezoneOffsetMinutes,
                game_id = apiKey
            };
            string json = JsonConvert.SerializeObject(payload);
            PlayerPrefs.SetString(PendingSessionEndKey, json);
            PlayerPrefs.Save();
            Debug.Log("[AeonAnalytics] Session end bilgisi PlayerPrefs'e kaydedildi.");
        }

        private async void SendSessionEndToBackend(string payloadJson = null, bool fromPrefs = false)
        {
            Debug.Log("[AeonAnalytics] SendSessionEndToBackend başladı.");
            string json = payloadJson;
            if (string.IsNullOrEmpty(json))
            {
                var endTime = DateTime.UtcNow;
                int durationSeconds = (int)(endTime - _sessionStartTime).TotalSeconds;
                string gameVersion = Application.version;
                int timezoneOffsetMinutes = (int)TimeZoneInfo.Local.GetUtcOffset(DateTime.UtcNow).TotalMinutes;

                var payload = new
                {
                    session_id = _sessionId,
                    end_time = endTime.ToString("o"),
                    duration_seconds = durationSeconds,
                    game_version = gameVersion,
                    timezone_offset_minutes = timezoneOffsetMinutes,
                    game_id = apiKey
                };
                json = JsonConvert.SerializeObject(payload);
            }
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            try
            {
                var response = await _httpClient.PostAsync($"{backendUrl}/api/sessions/end", content);
                Debug.Log("[AeonAnalytics] Session end HTTP isteği gönderildi.");
                if (response.IsSuccessStatusCode)
                {
                    Debug.Log("[AeonAnalytics] Session end başarıyla gönderildi.");
                    if (fromPrefs)
                    {
                        PlayerPrefs.DeleteKey(PendingSessionEndKey);
                        PlayerPrefs.Save();
                        Debug.Log("[AeonAnalytics] Pending session end PlayerPrefs'ten silindi.");
                    }
                }
                else
                {
                    Debug.LogError($"[AeonAnalytics] Failed to end session: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"[AeonAnalytics] Exception sending session end: {ex.Message}");
            }
            Debug.Log("[AeonAnalytics] SendSessionEndToBackend bitti.");
        }

        private void HandleLog(string logString, string stackTrace, LogType type)
        {
            if (type == LogType.Exception)
            {
                TrackError(logString, stackTrace);
            }
            else if (type == LogType.Error)
            {
                TrackError(logString, stackTrace);
            }
        }

        private IEnumerator PeriodicFlush()
        {
            while (true)
            {
                yield return new WaitForSeconds(FLUSH_INTERVAL);
                FlushEvents();
            }
        }

        private void QueueEvent(Dictionary<string, object> eventData)
        {
            if (_eventQueue.Count >= MAX_QUEUE_SIZE)
            {
                _eventQueue.Dequeue(); // Remove oldest event if queue is full
            }
            _eventQueue.Enqueue(eventData);

            if (debugMode)
            {
                Debug.Log($"[AeonAnalytics] Queued event: {eventData["eventName"]}");
            }
        }

        private async void FlushEvents()
        {
            if (_eventQueue.Count == 0) return;

            var events = new List<Dictionary<string, object>>();
            while (_eventQueue.Count > 0)
            {
                events.Add(_eventQueue.Dequeue());
            }

            try
            {
                var json = JsonConvert.SerializeObject(new { events });
                Debug.Log("[AeonAnalytics] Outgoing JSON: " + json);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync($"{backendUrl}/api/events", content);

                if (!response.IsSuccessStatusCode)
                {
                    Debug.LogError($"[AeonAnalytics] Failed to send events: {response.StatusCode}");
                    // Requeue events on failure
                    foreach (var evt in events)
                    {
                        QueueEvent(evt);
                    }
                }
                else if (debugMode)
                {
                    Debug.Log($"[AeonAnalytics] Successfully sent {events.Count} events");
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"[AeonAnalytics] Error sending events: {e.Message}");
                // Requeue events on error
                foreach (var evt in events)
                {
                    QueueEvent(evt);
                }
            }
        }

        public void TrackEvent(string eventName, Dictionary<string, object> properties = null)
        {
            var eventData = new Dictionary<string, object>
            {
                ["eventId"] = Guid.NewGuid().ToString(),
                ["sessionId"] = _sessionId,
                ["playerUid"] = _userId,
                ["eventName"] = eventName,
                ["eventType"] = "Event",
                ["timestamp"] = DateTime.UtcNow,
                ["gameId"] = apiKey,
                ["parameters"] = properties ?? new Dictionary<string, object>()
            };

            QueueEvent(eventData);
        }

        public void TrackProgression(string levelName, int levelNumber, string status, int? score = null, int? stars = null, Dictionary<string, object> properties = null)
        {
            var progressionParams = new Dictionary<string, object>
            {
                ["level_name"] = levelName,
                ["level_number"] = levelNumber,
                ["completion_status"] = status
            };

            if (score.HasValue) progressionParams["score"] = score.Value;
            if (stars.HasValue) progressionParams["stars"] = stars.Value;
            if (properties != null)
            {
                foreach (var prop in properties)
                {
                    progressionParams[prop.Key] = prop.Value;
                }
            }

            var eventData = new Dictionary<string, object>
            {
                ["eventId"] = Guid.NewGuid().ToString(),
                ["sessionId"] = _sessionId,
                ["playerUid"] = _userId,
                ["eventName"] = $"level_{status.ToLower()}",
                ["eventType"] = "Progression",
                ["timestamp"] = DateTime.UtcNow,
                ["gameId"] = apiKey,
                ["parameters"] = progressionParams
            };

            QueueEvent(eventData);
        }

        public void TrackMonetization(string productId, string productType, decimal amount, string currency, Dictionary<string, object> properties = null)
        {
            var monetizationParams = new Dictionary<string, object>
            {
                ["product_id"] = productId,
                ["product_type"] = productType,
                ["amount"] = amount,
                ["currency"] = currency,
                ["platform"] = Application.platform.ToString()
            };

            if (properties != null)
            {
                foreach (var prop in properties)
                {
                    monetizationParams[prop.Key] = prop.Value;
                }
            }

            var eventData = new Dictionary<string, object>
            {
                ["eventId"] = Guid.NewGuid().ToString(),
                ["sessionId"] = _sessionId,
                ["playerUid"] = _userId,
                ["eventName"] = "purchase",
                ["eventType"] = "Monetization",
                ["timestamp"] = DateTime.UtcNow,
                ["gameId"] = apiKey,
                ["parameters"] = monetizationParams
            };

            QueueEvent(eventData);
        }

        public void TrackCrash(string errorMessage, string stackTrace, Dictionary<string, object> properties = null)
        {
            var crashParams = new Dictionary<string, object>
            {
                ["error_message"] = errorMessage,
                ["stack_trace"] = stackTrace
            };

            if (properties != null)
            {
                foreach (var prop in properties)
                {
                    crashParams[prop.Key] = prop.Value;
                }
            }

            var eventData = new Dictionary<string, object>
            {
                ["eventId"] = Guid.NewGuid().ToString(),
                ["sessionId"] = _sessionId,
                ["playerUid"] = _userId,
                ["eventName"] = "crash",
                ["eventType"] = "Crash",
                ["timestamp"] = DateTime.UtcNow,
                ["gameId"] = apiKey,
                ["parameters"] = crashParams
            };

            QueueEvent(eventData);
        }

        public void TrackError(string errorMessage, string stackTrace, Dictionary<string, object> properties = null)
        {
            var errorParams = new Dictionary<string, object>
            {
                ["error_message"] = errorMessage,
                ["stack_trace"] = stackTrace
            };

            if (properties != null)
            {
                foreach (var prop in properties)
                {
                    errorParams[prop.Key] = prop.Value;
                }
            }

            var eventData = new Dictionary<string, object>
            {
                ["eventId"] = Guid.NewGuid().ToString(),
                ["sessionId"] = _sessionId,
                ["playerUid"] = _userId,
                ["eventName"] = "error",
                ["eventType"] = "Error",
                ["timestamp"] = DateTime.UtcNow,
                ["gameId"] = apiKey,
                ["parameters"] = errorParams
            };

            QueueEvent(eventData);
        }

        public void SetUserId(string userId)
        {
            if (string.IsNullOrEmpty(userId)) return;
            _userId = userId;
            PlayerPrefs.SetString("AeonAnalytics_UserId", userId);
        }
    }
} 