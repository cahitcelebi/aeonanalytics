# Newtonsoft.Json (Json.NET for Unity) Bağımlılığı

Bu SDK'nın doğru çalışabilmesi için Unity projenizin `manifest.json` dosyasına aşağıdaki satırı eklemeniz gerekmektedir:

```
"com.jillejr.newtonsoft.json-for-unity": "13.0.102"
```

## Nasıl Eklenir?
1. Unity projenizde `Packages/manifest.json` dosyasını açın.
2. `dependencies` kısmına yukarıdaki satırı ekleyin.
3. Unity editörünü yeniden başlatın.

Bu paket, event verilerinin backend'e doğru ve eksiksiz gönderilmesi için gereklidir.

Daha fazla bilgi için: [Json.NET for Unity (GitHub)](https://github.com/jilleJr/Newtonsoft.Json-for-Unity) 