using UnityEditor;
using UnityEngine;

namespace AeonAnalytics.Editor
{
    public class AeonAnalyticsSettings : EditorWindow
    {
        private static string apiKey = "";
        private static string assetPath = "Assets/AeonAnalyticsDemo/Resources/AeonAnalyticsSettings.asset";

        [MenuItem("Aeon Analytics/Settings", false, 1)]
        public static void ShowWindow()
        {
            LoadFromAsset();
            GetWindow<AeonAnalyticsSettings>("Aeon Analytics Settings");
        }

        private void OnGUI()
        {
            GUILayout.Label("Aeon Analytics API Key", EditorStyles.boldLabel);
            apiKey = EditorGUILayout.TextField("API Key", apiKey);

            if (GUILayout.Button("Save"))
            {
                SaveToAsset();
                EditorUtility.DisplayDialog("Aeon Analytics", "API Key saved!", "OK");
            }

            if (GUILayout.Button("Load"))
            {
                LoadFromAsset();
            }
        }

        private static void SaveToAsset()
        {
            // Klasör var mı kontrol et, yoksa oluştur
            string dir = System.IO.Path.GetDirectoryName(assetPath);
            if (!System.IO.Directory.Exists(dir))
            {
                System.IO.Directory.CreateDirectory(dir);
                AssetDatabase.Refresh();
            }
            var settings = AssetDatabase.LoadAssetAtPath<AeonAnalyticsSettingsSO>(assetPath);
            if (settings == null)
            {
                settings = ScriptableObject.CreateInstance<AeonAnalyticsSettingsSO>();
                AssetDatabase.CreateAsset(settings, assetPath);
            }
            settings.apiKey = apiKey;
            EditorUtility.SetDirty(settings);
            AssetDatabase.SaveAssets();
            Debug.Log("[AeonAnalytics] API Key saved: " + apiKey);
        }

        private static void LoadFromAsset()
        {
            var settings = AssetDatabase.LoadAssetAtPath<AeonAnalyticsSettingsSO>(assetPath);
            if (settings != null)
            {
                apiKey = settings.apiKey;
                Debug.Log("[AeonAnalytics] API Key loaded: " + apiKey);
            }
            else
            {
                Debug.LogWarning("[AeonAnalytics] No settings asset found at: " + assetPath);
            }
        }
    }
} 