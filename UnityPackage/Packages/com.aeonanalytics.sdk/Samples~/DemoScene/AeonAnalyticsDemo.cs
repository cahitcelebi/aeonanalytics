using UnityEngine;
using UnityEngine.UI;

namespace AeonAnalytics.Samples
{
    public class AeonAnalyticsDemo : MonoBehaviour
    {
        public Text logText;

        public void SendCustomEvent()
        {
            Log("Custom Event gönderildi!");
            // AeonAnalyticsManager.Instance.SendCustomEvent(...);
        }

        public void SendProgressionEvent()
        {
            Log("Progression Event gönderildi!");
            // AeonAnalyticsManager.Instance.SendProgressionEvent(...);
        }

        public void SendMonetizationEvent()
        {
            Log("Monetization Event gönderildi!");
            // AeonAnalyticsManager.Instance.SendMonetizationEvent(...);
        }

        public void SendErrorEvent()
        {
            Log("Error Event gönderildi!");
            // AeonAnalyticsManager.Instance.SendErrorEvent(...);
        }

        public void SendCrashEvent()
        {
            Log("Crash Event gönderildi!");
            // AeonAnalyticsManager.Instance.SendCrashEvent(...);
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