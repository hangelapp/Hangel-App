package com.hangel.app;

import android.webkit.PermissionRequest;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    @Override
    public void onStart() {
        super.onStart();
        // QR Okut (getUserMedia) için: WebView'in kamera/mikrofon izin isteğini grant et.
        // Capacitor 8 varsayılan WebChromeClient'i media-capture iznini otomatik vermiyor;
        // bu yüzden BridgeWebChromeClient'i genişletip yalnız onPermissionRequest'i override
        // ediyoruz (dosya seçici, JS dialog vb. Capacitor davranışı korunur).
        // İçerik yalnız birinci-taraf hangel.org.tr olduğundan grant güvenli.
        getBridge().getWebView().setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    try {
                        request.grant(request.getResources());
                    } catch (Exception ignored) {
                        // grant edilemezse sessiz geç
                    }
                });
            }
        });
    }
}
