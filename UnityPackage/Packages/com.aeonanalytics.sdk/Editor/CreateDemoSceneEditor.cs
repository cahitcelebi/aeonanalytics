using UnityEditor;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using UnityEngine.Events;
using System.IO;
using System.Text;
using UnityEditor.SceneManagement;
using UnityEditor.Events;

namespace AeonAnalytics.Editor
{
    public class CreateDemoSceneEditor : EditorWindow
    {
        [MenuItem("Aeon Analytics/Create Demo Scene", false, 10)]
        public static void CreateDemoScene()
        {
            // 1. Gerekli klasörleri oluştur
            string demoRoot = "Assets/AeonAnalyticsDemo";
            string scriptsDir = demoRoot + "/Scripts";
            string scenesDir = demoRoot + "/Scenes";
            if (!Directory.Exists(demoRoot)) Directory.CreateDirectory(demoRoot);
            if (!Directory.Exists(scriptsDir)) Directory.CreateDirectory(scriptsDir);
            if (!Directory.Exists(scenesDir)) Directory.CreateDirectory(scenesDir);

            // 2. asmdef dosyasını oluştur (varsa geç)
            string asmdefPath = Path.Combine(scriptsDir, "AeonAnalyticsDemo.asmdef");
            if (!File.Exists(asmdefPath))
            {
                var asmdefJson = new StringBuilder();
                asmdefJson.AppendLine("{");
                asmdefJson.AppendLine("  \"name\": \"AeonAnalyticsDemo\",");
                asmdefJson.AppendLine("  \"references\": [");
                asmdefJson.AppendLine("    \"AeonAnalytics.Runtime\"");
                asmdefJson.AppendLine("  ],");
                asmdefJson.AppendLine("  \"includePlatforms\": [");
                asmdefJson.AppendLine("    \"Editor\", \"Android\", \"iOS\", \"WebGL\", \"LinuxStandalone64\"");
                asmdefJson.AppendLine("  ],");
                asmdefJson.AppendLine("  \"allowUnsafeCode\": false,");
                asmdefJson.AppendLine("  \"autoReferenced\": true");
                asmdefJson.AppendLine("}");
                File.WriteAllText(asmdefPath, asmdefJson.ToString());
                AssetDatabase.ImportAsset(asmdefPath);
            }

            // 3. Demo scriptini kopyala (varsa geç)
            string targetScriptPath = Path.Combine(scriptsDir, "AeonAnalyticsDemo.cs");
            string sourceScriptPath = "Packages/com.aeonanalytics.sdk/Samples~/DemoScene/AeonAnalyticsDemo.cs";
            if (!File.Exists(targetScriptPath))
            {
                File.Copy(sourceScriptPath, targetScriptPath, true);
                AssetDatabase.ImportAsset(targetScriptPath);
            }

            // 4. AssetDatabase.Refresh() ile yeni dosyaları derlet
            AssetDatabase.Refresh();

            // 5. Demo sahnesini oluştur
            var newScene = UnityEditor.SceneManagement.EditorSceneManager.NewScene(UnityEditor.SceneManagement.NewSceneSetup.DefaultGameObjects, UnityEditor.SceneManagement.NewSceneMode.Single);
            newScene.name = "DemoScene";

            // EventSystem kontrolü
            if (FindObjectOfType<EventSystem>() == null)
            {
                var eventSystem = new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
            }

            // Canvas oluştur
            var canvasGO = new GameObject("Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            var canvas = canvasGO.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            var scaler = canvasGO.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);

            // Panel ve butonlar (modern ve responsive)
            var panelGO = new GameObject("ButtonPanel", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image));
            panelGO.transform.SetParent(canvasGO.transform, false);
            var panelRect = panelGO.GetComponent<RectTransform>();
            panelRect.anchorMin = new Vector2(0.5f, 0.5f);
            panelRect.anchorMax = new Vector2(0.5f, 0.5f);
            panelRect.pivot = new Vector2(0.5f, 0.5f);
            panelRect.sizeDelta = new Vector2(600, 900);
            panelRect.anchoredPosition = new Vector2(0, 200);
            var panelImage = panelGO.GetComponent<Image>();
            panelImage.color = new Color(0.13f, 0.13f, 0.13f, 0.85f);

            string[] buttonLabels = new string[] {
                "Send Custom Event",
                "Send Progression Event",
                "Send Monetization Event",
                "Send Error Event",
                "Send Crash Event",
                "Send Device Info",
                "Send Session Start",
                "Send Session End"
            };
            string[] methodNames = new string[] {
                "SendCustomEvent",
                "SendProgressionEvent",
                "SendMonetizationEvent",
                "SendErrorEvent",
                "SendCrashEvent",
                "SendDeviceInfo",
                "SendSessionStart",
                "SendSessionEnd"
            };

            for (int i = 0; i < buttonLabels.Length; i++)
            {
                var buttonGO = new GameObject(buttonLabels[i], typeof(RectTransform), typeof(CanvasRenderer), typeof(Image), typeof(Button));
                buttonGO.transform.SetParent(panelGO.transform, false);
                var rect = buttonGO.GetComponent<RectTransform>();
                rect.sizeDelta = new Vector2(540, 90);
                rect.anchoredPosition = new Vector2(0, 350 - i * 120);
                var image = buttonGO.GetComponent<Image>();
                image.color = new Color(0.22f, 0.22f, 0.22f, 1f);
                var button = buttonGO.GetComponent<Button>();

                var textGO = new GameObject("Text", typeof(RectTransform), typeof(CanvasRenderer));
                textGO.transform.SetParent(buttonGO.transform, false);
                var textRect = textGO.GetComponent<RectTransform>();
                textRect.anchorMin = Vector2.zero;
                textRect.anchorMax = Vector2.one;
                textRect.offsetMin = Vector2.zero;
                textRect.offsetMax = Vector2.zero;
                var text = textGO.AddComponent<Text>();
                text.text = buttonLabels[i];
                text.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                text.fontSize = 36;
                text.alignment = TextAnchor.MiddleCenter;
                text.color = Color.white;
            }

            // Log panelini ekranın alt ortasına ve geniş yap
            var logPanelGO = new GameObject("LogPanel", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image));
            logPanelGO.transform.SetParent(canvasGO.transform, false);
            var logPanelRect = logPanelGO.GetComponent<RectTransform>();
            logPanelRect.anchorMin = new Vector2(0.5f, 0);
            logPanelRect.anchorMax = new Vector2(0.5f, 0);
            logPanelRect.pivot = new Vector2(0.5f, 0);
            logPanelRect.sizeDelta = new Vector2(1000, 180);
            logPanelRect.anchoredPosition = new Vector2(0, 60);
            var logPanelImage = logPanelGO.GetComponent<Image>();
            logPanelImage.color = new Color(0.09f, 0.09f, 0.09f, 0.85f);

            var logTextGO = new GameObject("LogText", typeof(RectTransform), typeof(CanvasRenderer));
            logTextGO.transform.SetParent(logPanelGO.transform, false);
            var logTextRect = logTextGO.GetComponent<RectTransform>();
            logTextRect.anchorMin = Vector2.zero;
            logTextRect.anchorMax = Vector2.one;
            logTextRect.offsetMin = new Vector2(40, 30);
            logTextRect.offsetMax = new Vector2(-40, -30);
            var logText = logTextGO.AddComponent<Text>();
            logText.text = "Aeon Analytics Log\n";
            logText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            logText.fontSize = 28;
            logText.alignment = TextAnchor.UpperLeft;
            logText.color = Color.white;
            logText.horizontalOverflow = HorizontalWrapMode.Wrap;
            logText.verticalOverflow = VerticalWrapMode.Overflow;

            // AeonAnalyticsDemo scriptini ekle (derleme bekleme ve retry mekanizması)
            void TryAddDemoScript()
            {
                var demoGO = new GameObject("AeonAnalyticsDemo");
                System.Type demoScriptType = null;
                var typeNames = new[] {
                    "AeonAnalytics.Samples.AeonAnalyticsDemo, AeonAnalyticsDemo",
                    "AeonAnalytics.Samples.AeonAnalyticsDemo, Assembly-CSharp",
                    "AeonAnalytics.Samples.AeonAnalyticsDemo"
                };
                foreach (var t in typeNames) {
                    demoScriptType = System.Type.GetType(t);
                    if (demoScriptType != null) break;
                }
                if (demoScriptType != null)
                {
                    var demoScript = (MonoBehaviour)demoGO.AddComponent(demoScriptType);
                    Debug.Log("[AeonAnalytics] AeonAnalyticsDemo scripti başarıyla eklendi.");
                    // LogText alanını otomatik bağla
                    var logTextField = demoScriptType.GetField("logText");
                    if (logTextField != null)
                    {
                        var logTextObj = GameObject.Find("LogText");
                        if (logTextObj != null)
                        {
                            var textComponent = logTextObj.GetComponent<UnityEngine.UI.Text>();
                            if (textComponent != null)
                                logTextField.SetValue(demoScript, textComponent);
                        }
                    }
                    // UI bağlantıları (callbackler tek instance'a)
                    for (int i = 0; i < buttonLabels.Length; i++)
                    {
                        var buttonGO = panelGO.transform.GetChild(i).GetComponent<Button>();
                        if (buttonGO != null && demoScript != null)
                        {
                            var methodName = methodNames[i];
                            var methodInfo = demoScriptType.GetMethod(methodName);
                            if (methodInfo != null)
                            {
                                UnityAction action = (UnityAction)System.Delegate.CreateDelegate(typeof(UnityAction), demoScript, methodInfo);
                                UnityEditor.Events.UnityEventTools.AddPersistentListener(buttonGO.onClick, action);
                            }
                        }
                    }
                    // 6. Sahneyi mutlaka Scenes klasörüne kaydet
                    string scenePath = Path.Combine(scenesDir, "DemoScene.unity");
                    UnityEditor.SceneManagement.EditorSceneManager.SaveScene(newScene, scenePath);
                    AssetDatabase.Refresh();
                    EditorUtility.DisplayDialog("Aeon Analytics", "Demo Scene başarıyla oluşturuldu!\n\n" + scenePath, "OK");
                }
                else
                {
                    Debug.LogWarning("[AeonAnalytics] Script derlenmedi, tekrar denenecek...");
                    // Derleme tamamlanana kadar tekrar dene
                    int retryCount = 0;
                    EditorApplication.CallbackFunction retry = null;
                    retry = () => {
                        retryCount++;
                        System.Type retryType = null;
                        foreach (var t in typeNames) {
                            retryType = System.Type.GetType(t);
                            if (retryType != null) break;
                        }
                        if (retryType != null)
                        {
                            var demoScript = (MonoBehaviour)demoGO.AddComponent(retryType);
                            Debug.Log("[AeonAnalytics] AeonAnalyticsDemo scripti derleme sonrası başarıyla eklendi.");
                            // LogText alanını otomatik bağla
                            var logTextField = retryType.GetField("logText");
                            if (logTextField != null)
                            {
                                var logTextObj = GameObject.Find("LogText");
                                if (logTextObj != null)
                                {
                                    var textComponent = logTextObj.GetComponent<UnityEngine.UI.Text>();
                                    if (textComponent != null)
                                        logTextField.SetValue(demoScript, textComponent);
                                }
                            }
                            // UI bağlantıları (callbackler tek instance'a)
                            for (int i = 0; i < buttonLabels.Length; i++)
                            {
                                var buttonGO = panelGO.transform.GetChild(i).GetComponent<Button>();
                                if (buttonGO != null && demoScript != null)
                                {
                                    var methodName = methodNames[i];
                                    var methodInfo = retryType.GetMethod(methodName);
                                    if (methodInfo != null)
                                    {
                                        UnityAction action = (UnityAction)System.Delegate.CreateDelegate(typeof(UnityAction), demoScript, methodInfo);
                                        UnityEditor.Events.UnityEventTools.AddPersistentListener(buttonGO.onClick, action);
                                    }
                                }
                            }
                            // 6. Sahneyi mutlaka Scenes klasörüne kaydet
                            string scenePath = Path.Combine(scenesDir, "DemoScene.unity");
                            UnityEditor.SceneManagement.EditorSceneManager.SaveScene(newScene, scenePath);
                            AssetDatabase.Refresh();
                            EditorUtility.DisplayDialog("Aeon Analytics", "Demo Scene başarıyla oluşturuldu!\n\n" + scenePath, "OK");
                            EditorApplication.update -= retry;
                        }
                        else if (retryCount > 1000) // ~10-20 saniye sonra vazgeç
                        {
                            EditorApplication.update -= retry;
                            EditorUtility.DisplayDialog("Aeon Analytics", "Script component eklenemedi! Lütfen Unity derlemesi tamamlandıktan sonra tekrar deneyin.", "OK");
                            Debug.LogError("[AeonAnalytics] Script component eklenemedi! targetScriptPath: " + targetScriptPath);
                        }
                    };
                    EditorApplication.update += retry;
                }
            }
            EditorApplication.delayCall += TryAddDemoScript;
        }

        [MenuItem("Aeon Analytics/Create Aeon Analytics Manager", false, 11)]
        public static void CreateAeonAnalyticsManager()
        {
            // Sahnede zaten AeonAnalyticsManager var mı kontrol et
            var existing = Object.FindObjectOfType<AeonAnalyticsManager>();
            if (existing != null)
            {
                EditorUtility.DisplayDialog("Aeon Analytics", "Sahnede zaten bir AeonAnalyticsManager var!", "OK");
                Selection.activeGameObject = existing.gameObject;
                return;
            }
            // Yeni GameObject oluştur ve component ekle
            var go = new GameObject("AeonAnalyticsManager");
            go.AddComponent<AeonAnalyticsManager>();
            Undo.RegisterCreatedObjectUndo(go, "Create AeonAnalyticsManager");
            Selection.activeGameObject = go;
            EditorUtility.DisplayDialog("Aeon Analytics", "AeonAnalyticsManager başarıyla sahneye eklendi!", "OK");
        }
    }
} 