# Aeon Analytics Unity SDK

> **IMPORTANT: Newtonsoft.Json (Json.NET for Unity) Dependency**
>
> This SDK requires [Newtonsoft.Json for Unity](https://github.com/jilleJr/Newtonsoft.Json-for-Unity).
> 
> **How to add:**
> 1. Open Unity and go to `Window > Package Manager`.
> 2. Click the `+` button and select `Add package from git URL...`
> 3. Paste this URL:
>    ```
>    https://github.com/jilleJr/Newtonsoft.Json-for-Unity.git#upm
>    ```
> 4. Click `Add`.
>
> This package is required for event serialization and backend communication.

A modern, user-friendly analytics SDK for Unity, with demo scene, editor integration, and easy event tracking. This SDK provides comprehensive analytics tracking for your Unity games, including standard events, progression, monetization, crashes, and errors.

## Installation

1. Import the `AeonAnalyticsSDK.unitypackage` into your Unity project:
   - In Unity, go to `Assets > Import Package > Custom Package`
   - Select the `AeonAnalyticsSDK.unitypackage` file
   - Click "Import"

2. The SDK will be imported into your project's Assets folder with the following structure:
   ```
   Assets/
   └── AeonAnalyticsSDK/
       ├── Runtime/
       │   ├── AeonAnalyticsManager.cs
       │   └── Prefabs/
       │       └── AeonAnalyticsManager.prefab
       ├── Editor/
       │   ├── AeonAnalyticsManagerEditor.cs
       │   └── AeonAnalyticsMenu.cs
       └── Demo/
           ├── DemoScene.unity
           └── DemoUIController.cs
   ```

## Quick Start

1. **Add Analytics Manager to Scene:**
   - Go to `Tools > AeonAnalytics > Add Manager to Scene`
   - This will create a prefab instance of the analytics manager

2. **Configure API Key:**
   - Select the AeonAnalyticsManager in your scene
   - In the Inspector, enter your API key
   - Enable Debug Mode if you want to see detailed logs

3. **Send Events:**
   ```csharp
   using AeonAnalytics;

   // Track a custom event
   AeonAnalyticsManager.Instance.TrackEvent("level_start", new Dictionary<string, object> {
       { "level_name", "Level 1" },
       { "difficulty", "hard" }
   });

   // Track progression
   AeonAnalyticsManager.Instance.TrackProgression(
       levelName: "Level 1",
       levelNumber: 1,
       status: "completed",
       score: 100,
       stars: 3
   );

   // Track monetization
   AeonAnalyticsManager.Instance.TrackMonetization(
       productId: "item_1",
       productType: "consumable",
       amount: 4.99m,
       currency: "USD"
   );

   // Track crash/error
   AeonAnalyticsManager.Instance.TrackError("Game error", "Stack trace");
   ```

## Event Types

### 1. Standard Events
```csharp
TrackEvent(string eventName, Dictionary<string, object> properties = null)
```
- Use for custom game events
- Properties can include any key-value pairs
- Automatically includes device and session info

### 2. Progression Events
```csharp
TrackProgression(string levelName, int levelNumber, string status, int? score = null, int? stars = null)
```
- Track level progress
- Status: "started", "completed", "failed"
- Optional score and stars
- Automatically tracks attempts

### 3. Monetization Events
```csharp
TrackMonetization(string productId, string productType, decimal amount, string currency)
```
- Track in-app purchases
- Product type: "consumable", "non_consumable", "subscription"
- Amount and currency required
- Automatically includes platform info

### 4. Crash & Error Events
```csharp
TrackCrash(string errorMessage, string stackTrace)
TrackError(string errorMessage, string stackTrace)
```
- Automatic crash detection
- Manual error tracking
- Includes stack trace and device info

## Demo Scene

The demo scene (`DemoScene.unity`) includes:
- UI buttons for all event types
- Input fields for customizing event data
- Real-time log panel
- Status display
- API key configuration

To try the demo:
1. Open `Tools > AeonAnalytics > Open Demo Scene`
2. Enter your API key in the Inspector
3. Press Play
4. Use the UI to send test events

## Features

- **Automatic Session Tracking**
  - Session start/end events
  - Session duration
  - Device and user info

- **Device Information**
  - Platform
  - Device model
  - OS version
  - Screen resolution
  - Language
  - Timezone

- **Event Queue & Batching**
  - Events are queued and sent in batches
  - Automatic retry on failure
  - Configurable queue size and flush interval

- **Debug Mode**
  - Detailed logging
  - Event validation
  - Network status

## Production Use

1. **API Key Management**
   - Store API key securely
   - Use different keys for development/production
   - Never expose API key in client code

2. **Event Design**
   - Use consistent event names
   - Include relevant properties
   - Follow the event schema

3. **Error Handling**
   - Implement proper error handling
   - Use try-catch blocks
   - Log errors appropriately

4. **Testing**
   - Test all event types
   - Verify data in dashboard
   - Check error handling

## Support

For more information and support:
- Documentation: https://docs.aeonanalytics.com
- Support: support@aeonanalytics.com
- GitHub: https://github.com/aeonanalytics/unity-sdk

## License

This SDK is licensed under the MIT License. See the LICENSE file for details. 