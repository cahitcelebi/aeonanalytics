using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;
using AeonAnalytics;
using System;

public class DemoUIController : MonoBehaviour
{
    [Header("UI References")]
    public Button trackEventButton;
    public Button trackProgressionButton;
    public Button trackMonetizationButton;
    public Button trackCrashButton;
    public Button trackErrorButton;
    public TMP_Text logText;
    public TMP_InputField customEventNameInput;
    public TMP_InputField customEventValueInput;
    public TMP_InputField levelNameInput;
    public TMP_InputField levelNumberInput;
    public TMP_InputField scoreInput;
    public TMP_InputField starsInput;
    public TMP_InputField productIdInput;
    public TMP_InputField productTypeInput;
    public TMP_InputField amountInput;
    public TMP_InputField currencyInput;
    public TMP_Text statusText;

    private void Start()
    {
        InitializeUI();
        SetupEventListeners();
        UpdateStatus();
    }

    private void InitializeUI()
    {
        // Set default values
        if (levelNameInput != null) levelNameInput.text = "Level 1";
        if (levelNumberInput != null) levelNumberInput.text = "1";
        if (scoreInput != null) scoreInput.text = "100";
        if (starsInput != null) starsInput.text = "3";
        if (productIdInput != null) productIdInput.text = "item_1";
        if (productTypeInput != null) productTypeInput.text = "consumable";
        if (amountInput != null) amountInput.text = "4.99";
        if (currencyInput != null) currencyInput.text = "USD";
    }

    private void SetupEventListeners()
    {
        // Custom Event
        trackEventButton?.onClick.AddListener(() => {
            var eventName = customEventNameInput?.text ?? "demo_event";
            var eventValue = customEventValueInput?.text ?? "123";
            var properties = new Dictionary<string, object> {
                { "value", eventValue },
                { "timestamp", DateTime.UtcNow.ToString("o") }
            };
            AeonAnalyticsManager.Instance.TrackEvent(eventName, properties);
            Log($"TrackEvent sent: {eventName} with value {eventValue}");
        });

        // Progression Event
        trackProgressionButton?.onClick.AddListener(() => {
            var levelName = levelNameInput?.text ?? "Level 1";
            var levelNumber = int.Parse(levelNumberInput?.text ?? "1");
            var score = int.Parse(scoreInput?.text ?? "100");
            var stars = int.Parse(starsInput?.text ?? "3");
            
            AeonAnalyticsManager.Instance.TrackProgression(
                levelName,
                levelNumber,
                "completed",
                score,
                stars
            );
            Log($"TrackProgression sent: {levelName} (Level {levelNumber}) - Score: {score}, Stars: {stars}");
        });

        // Monetization Event
        trackMonetizationButton?.onClick.AddListener(() => {
            var productId = productIdInput?.text ?? "item_1";
            var productType = productTypeInput?.text ?? "consumable";
            var amount = decimal.Parse(amountInput?.text ?? "4.99");
            var currency = currencyInput?.text ?? "USD";

            AeonAnalyticsManager.Instance.TrackMonetization(
                productId,
                productType,
                amount,
                currency
            );
            Log($"TrackMonetization sent: {productId} ({productType}) - {amount} {currency}");
        });

        // Crash Event
        trackCrashButton?.onClick.AddListener(() => {
            var crashMessage = "Demo crash at " + DateTime.UtcNow.ToString("o");
            var stackTrace = "Demo stack trace\nat DemoUIController.cs:123\nat DemoScene.cs:456";
            AeonAnalyticsManager.Instance.TrackCrash(crashMessage, stackTrace);
            Log($"TrackCrash sent: {crashMessage}");
        });

        // Error Event
        trackErrorButton?.onClick.AddListener(() => {
            var errorMessage = "Demo error at " + DateTime.UtcNow.ToString("o");
            var stackTrace = "Demo stack trace\nat DemoUIController.cs:123\nat DemoScene.cs:456";
            AeonAnalyticsManager.Instance.TrackError(errorMessage, stackTrace);
            Log($"TrackError sent: {errorMessage}");
        });
    }

    private void UpdateStatus()
    {
        if (statusText != null)
        {
            var manager = AeonAnalyticsManager.Instance;
            statusText.text = $"Status:\n" +
                            $"API Key: {(string.IsNullOrEmpty(manager.ApiKey) ? "Not Set" : "Configured")}\n" +
                            $"Debug Mode: {(manager.DebugMode ? "Enabled" : "Disabled")}";
        }
    }

    private void Log(string msg)
    {
        if (logText != null)
        {
            var timestamp = DateTime.Now.ToString("HH:mm:ss");
            logText.text = $"[{timestamp}] {msg}\n" + logText.text;
            
            // Limit log length
            if (logText.text.Length > 5000)
            {
                logText.text = logText.text.Substring(0, 5000);
            }
        }
        Debug.Log($"[AeonAnalytics Demo] {msg}");
    }

    private void OnDestroy()
    {
        // Clean up event listeners
        trackEventButton?.onClick.RemoveAllListeners();
        trackProgressionButton?.onClick.RemoveAllListeners();
        trackMonetizationButton?.onClick.RemoveAllListeners();
        trackCrashButton?.onClick.RemoveAllListeners();
        trackErrorButton?.onClick.RemoveAllListeners();
    }
} 