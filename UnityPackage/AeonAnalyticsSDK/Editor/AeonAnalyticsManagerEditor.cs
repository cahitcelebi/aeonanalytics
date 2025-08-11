using UnityEditor;
using UnityEngine;
using AeonAnalytics;
using System;

[CustomEditor(typeof(AeonAnalyticsManager))]
public class AeonAnalyticsManagerEditor : Editor
{
    private bool showAdvancedSettings = false;
    private bool showEventTypes = false;
    private bool showDocumentation = false;

    public override void OnInspectorGUI()
    {
        serializedObject.Update();

        EditorGUILayout.Space(10);
        EditorGUILayout.LabelField("Aeon Analytics SDK", EditorStyles.boldLabel);
        EditorGUILayout.Space(5);

        // API Key
        EditorGUILayout.BeginHorizontal();
        EditorGUILayout.PropertyField(serializedObject.FindProperty("apiKey"), new GUIContent("API Key"));
        if (GUILayout.Button("Copy", GUILayout.Width(60)))
        {
            EditorGUIUtility.systemCopyBuffer = serializedObject.FindProperty("apiKey").stringValue;
        }
        EditorGUILayout.EndHorizontal();

        // Debug Mode
        EditorGUILayout.PropertyField(serializedObject.FindProperty("debugMode"), new GUIContent("Debug Mode"));

        // Backend URL
        EditorGUILayout.PropertyField(serializedObject.FindProperty("backendUrl"), new GUIContent("Backend URL"));

        EditorGUILayout.Space(10);

        // Advanced Settings
        showAdvancedSettings = EditorGUILayout.Foldout(showAdvancedSettings, "Advanced Settings", true);
        if (showAdvancedSettings)
        {
            EditorGUI.indentLevel++;
            EditorGUILayout.HelpBox(
                "Advanced settings are configured for optimal performance. " +
                "Modify only if you understand the implications.",
                MessageType.Info
            );
            EditorGUI.indentLevel--;
        }

        EditorGUILayout.Space(10);

        // Event Types
        showEventTypes = EditorGUILayout.Foldout(showEventTypes, "Available Event Types", true);
        if (showEventTypes)
        {
            EditorGUI.indentLevel++;
            EditorGUILayout.LabelField("Standard Events:", EditorStyles.boldLabel);
            EditorGUILayout.LabelField("• TrackEvent(string eventName, Dictionary<string, object> properties = null)");
            EditorGUILayout.LabelField("• TrackProgression(string levelName, int levelNumber, string status, int? score = null, int? stars = null)");
            EditorGUILayout.LabelField("• TrackMonetization(string productId, string productType, decimal amount, string currency)");
            EditorGUILayout.LabelField("• TrackCrash(string errorMessage, string stackTrace)");
            EditorGUILayout.LabelField("• TrackError(string errorMessage, string stackTrace)");
            EditorGUI.indentLevel--;
        }

        EditorGUILayout.Space(10);

        // Documentation
        showDocumentation = EditorGUILayout.Foldout(showDocumentation, "Documentation & Help", true);
        if (showDocumentation)
        {
            EditorGUI.indentLevel++;
            if (GUILayout.Button("Open Documentation"))
            {
                Application.OpenURL("https://docs.aeonanalytics.com");
            }
            if (GUILayout.Button("Open Demo Scene"))
            {
                AeonAnalyticsMenu.OpenDemoScene();
            }
            EditorGUI.indentLevel--;
        }

        EditorGUILayout.Space(10);

        // Status
        var manager = (AeonAnalyticsManager)target;
        EditorGUILayout.BeginVertical(EditorStyles.helpBox);
        EditorGUILayout.LabelField("Status", EditorStyles.boldLabel);
        EditorGUILayout.LabelField("API Key: " + (string.IsNullOrEmpty(manager.ApiKey) ? "Not Set" : "Configured"));
        EditorGUILayout.LabelField("Debug Mode: " + (manager.DebugMode ? "Enabled" : "Disabled"));
        EditorGUILayout.EndVertical();

        serializedObject.ApplyModifiedProperties();
    }
} 