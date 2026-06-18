package com.hangel.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.webkit.PermissionRequest;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    // QR Okut (getUserMedia) kamera izni akışı.
    private static final int CAMERA_PERMISSION_REQ = 9317;
    private PermissionRequest pendingCameraRequest;

    @Override
    public void onStart() {
        super.onStart();
        // WebView'in kamera/mikrofon izin isteğini ele al. WebView grant'i TEK BAŞINA
        // yetmez — Android 6+'da OS-seviyesi runtime CAMERA izni de alınmalı. O yüzden
        // izin yoksa önce kullanıcıdan iste, alınca WebView'e grant et (yoksa kamera
        // "erişilemedi" hatası verir). İçerik yalnız birinci-taraf hangel.org.tr.
        getBridge().getWebView().setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    boolean needsCamera = false;
                    for (String res : request.getResources()) {
                        if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(res)) {
                            needsCamera = true;
                            break;
                        }
                    }
                    if (needsCamera
                            && ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA)
                                != PackageManager.PERMISSION_GRANTED) {
                        // OS izni yok → iste; sonuç onRequestPermissionsResult'ta grant edilir.
                        pendingCameraRequest = request;
                        ActivityCompat.requestPermissions(
                                MainActivity.this,
                                new String[]{ Manifest.permission.CAMERA },
                                CAMERA_PERMISSION_REQ);
                    } else {
                        try {
                            request.grant(request.getResources());
                        } catch (Exception ignored) {
                            // grant edilemezse sessiz geç
                        }
                    }
                });
            }
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == CAMERA_PERMISSION_REQ && pendingCameraRequest != null) {
            final PermissionRequest req = pendingCameraRequest;
            pendingCameraRequest = null;
            final boolean granted = grantResults.length > 0
                    && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            runOnUiThread(() -> {
                try {
                    if (granted) {
                        req.grant(req.getResources());
                    } else {
                        req.deny();
                    }
                } catch (Exception ignored) {
                    // yoksay
                }
            });
        }
    }
}
