using UnityEditor;
using UnityEngine;
using AeonAnalytics;
using System.IO;

public static class AeonAnalyticsMenu
{
    private const string PREFAB_PATH = "Assets/AeonAnalyticsSDK/Runtime/Prefabs/AeonAnalyticsManager.prefab";
    private const string DEMO_SCENE_PATH = "Assets/AeonAnalyticsSDK/Demo/DemoScene.unity";

    [MenuItem("Tools/AeonAnalytics/Add Manager to Scene")]
    public static void AddManagerToScene()
    {
        // Check if manager already exists
        if (Object.FindObjectOfType<AeonAnalyticsManager>() != null)
        {
            Debug.LogWarning("AeonAnalyticsManager already exists in the scene.");
            return;
        }

        // Try to load from prefab first
        GameObject managerPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(PREFAB_PATH);
        if (managerPrefab != null)
        {
            GameObject instance = PrefabUtility.InstantiatePrefab(managerPrefab) as GameObject;
            Selection.activeGameObject = instance;
            Debug.Log("AeonAnalyticsManager prefab added to the scene.");
            return;
        }

        // If prefab doesn't exist, create a new one
        var go = new GameObject("AeonAnalyticsManager");
        var manager = go.AddComponent<AeonAnalyticsManager>();

        // Create prefab directory if it doesn't exist
        string prefabDir = Path.GetDirectoryName(PREFAB_PATH);
        if (!Directory.Exists(prefabDir))
        {
            Directory.CreateDirectory(prefabDir);
        }

        // Create the prefab
        PrefabUtility.SaveAsPrefabAsset(go, PREFAB_PATH);
        Object.DestroyImmediate(go);

        // Instantiate the newly created prefab
        managerPrefab = AssetDatabase.LoadAssetAtPath<GameObject>(PREFAB_PATH);
        GameObject newInstance = PrefabUtility.InstantiatePrefab(managerPrefab) as GameObject;
        Selection.activeGameObject = newInstance;
        Debug.Log("AeonAnalyticsManager prefab created and added to the scene.");
    }

    [MenuItem("Tools/AeonAnalytics/Open Demo Scene")]
    public static void OpenDemoScene()
    {
        if (File.Exists(DEMO_SCENE_PATH))
        {
            UnityEditor.SceneManagement.EditorSceneManager.OpenScene(DEMO_SCENE_PATH);
        }
        else
        {
            Debug.LogError($"Demo scene not found at: {DEMO_SCENE_PATH}");
        }
    }

    [MenuItem("Tools/AeonAnalytics/Documentation")]
    public static void OpenDocumentation()
    {
        Application.OpenURL("https://docs.aeonanalytics.com");
    }
} 