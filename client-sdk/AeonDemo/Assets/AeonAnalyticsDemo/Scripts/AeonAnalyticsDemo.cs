using UnityEngine;
using UnityEngine.UI;
using System.Collections;

namespace AeonAnalytics.Samples
{
    public class AeonAnalyticsDemo : MonoBehaviour
    {
        public Text logText;

        public void SendCustomEvent()
        {
            Log("Custom Event gönderildi!");
            var extra = new System.Collections.Generic.Dictionary<string, string> { { "value", "123" } };
            StartCoroutine(AeonAnalyticsManager.Instance.TrackEvent("custom_event", "custom", extra));
        }

        public void SendProgressionEvent()
        {
            Log("Progression Event gönderildi!");
            var extra = new System.Collections.Generic.Dictionary<string, string> {
                { "levelName", "Level 1" },
                { "levelNumber", "1" },
                { "status", "completed" },
                { "score", "100" },
                { "stars", "3" }
            };
            StartCoroutine(AeonAnalyticsManager.Instance.TrackEvent("level_completed", "progression", extra));
        }

        public void SendMonetizationEvent()
        {
            Log("Monetization Event gönderildi!");
            var extra = new System.Collections.Generic.Dictionary<string, string> {
                { "productId", "item_1" },
                { "productType", "consumable" },
                { "amount", "4.99" },
                { "currency", "USD" }
            };
            StartCoroutine(AeonAnalyticsManager.Instance.TrackEvent("purchase", "monetization", extra));
        }

        public void SendErrorEvent()
        {
            Log("Error Event gönderildi!");
            var extra = new System.Collections.Generic.Dictionary<string, string> {
                { "errorMessage", "Demo error" },
                { "stackTrace", "Demo stack trace" }
            };
            StartCoroutine(AeonAnalyticsManager.Instance.TrackEvent("error", "error", extra));
        }

        public void SendCrashEvent()
        {
            Log("Crash Event gönderildi!");
            var extra = new System.Collections.Generic.Dictionary<string, string> {
                { "errorMessage", "Demo crash" },
                { "stackTrace", "Demo stack trace" }
            };
            StartCoroutine(AeonAnalyticsManager.Instance.TrackEvent("crash", "crash", extra));
        }

        public void SendDeviceInfo()
        {
            Log("Device Info gönderildi!");
            // AeonAnalyticsManager.Instance.SendDeviceInfo();
        }

        public void SendSessionStart()
        {
            Log("Session Start gönderildi!");
            // AeonAnalyticsManager.Instance.SendSessionStart();
        }

        public void SendSessionEnd()
        {
            Log("Session End gönderildi!");
            // AeonAnalyticsManager.Instance.SendSessionEnd();
        }

        private void Log(string message)
        {
            if (logText != null)
                logText.text += message + "\n";
            Debug.Log(message);
        }
    }
} 