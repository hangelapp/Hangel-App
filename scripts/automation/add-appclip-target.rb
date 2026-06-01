#!/usr/bin/env ruby
# add-appclip-target.rb — HangelAppClip target'ını App.xcodeproj'a idempotent ekler.
#
# App Clip = parent app'ten ayrı, küçük (≤15 MB) bağımsız bir SwiftUI mini-app.
# Kullanıcı App Clip Experience URL'ini (https://hangel.org.tr/clip/event/{id})
# QR / NFC / Safari ile açtığında iOS App Clip Card açar; clip indirilir ve
# tek seferlik check-in akışı çalıştırılır.
#
# Yaptıkları:
#   1. `HangelAppClip` PBXGroup'unu main_group altında oluşturur (yoksa).
#   2. `ios/App/HangelAppClip/` altındaki .swift dosyalarını grouba ekler.
#   3. `Info.plist` + `HangelAppClip.entitlements` referansını ekler.
#   4. `HangelAppClip` adlı yeni native target oluşturur:
#        - product type: com.apple.product-type.application.on-demand-install-capable
#        - SDK: iphoneos
#        - iOS deployment target: 16.0 (Advanced App Clip Experiences için)
#        - Bundle ID: com.hangel.ios.app.Clip
#        - Parent App ID: com.hangel.ios.app
#        - SwiftUI lifecycle (no storyboard)
#   5. App target'a "Embed App Clips" copy phase ekler + dependency kurar.
#
# Kullanım:
#   ruby scripts/automation/add-appclip-target.rb
#
# Idempotent: tekrar tekrar çalıştırılabilir, mevcut dosyaları/target'ı
# duplicate etmez. Çalıştırmadan önce pbxproj backup commit'i yapmak önerilir.
#
# Referans: scripts/automation/add-watch-target.rb (watchOS target ekleme örneği)

require 'xcodeproj'

ROOT = File.expand_path('../../..', __FILE__)
PROJECT_PATH = File.join(ROOT, 'ios', 'App', 'App.xcodeproj')
CLIP_DIR_NAME = 'HangelAppClip'
CLIP_DIR_FS = File.join(ROOT, 'ios', 'App', CLIP_DIR_NAME)
CLIP_TARGET_NAME = 'HangelAppClip'
CLIP_BUNDLE_ID = 'com.hangel.ios.app.Clip'
APP_BUNDLE_ID = 'com.hangel.ios.app'
CLIP_SWIFT_FILES = %w[
  HangelAppClipApp.swift
  ContentView.swift
  ClipState.swift
  ClipAPI.swift
].freeze
CLIP_INFO_PLIST = 'Info.plist'
CLIP_ENTITLEMENTS = 'HangelAppClip.entitlements'
CLIP_DEPLOYMENT_TARGET = '16.0'
DEVELOPMENT_TEAM = 'NKZNY8NU8S'

# App Clip için Apple product type — on-demand install capable
# "com.apple.product-type.application.on-demand-install-capable"
# xcodeproj gem'in built-in :application sembolü değil, manuel.
APP_CLIP_PRODUCT_TYPE = 'com.apple.product-type.application.on-demand-install-capable'

project = Xcodeproj::Project.open(PROJECT_PATH)
app_target = project.targets.find { |t| t.name == 'App' }
abort 'ERROR: App target not found' unless app_target

# ---------------------------------------------------------------------------
# 1. HangelAppClip group'unu yarat / bul
# ---------------------------------------------------------------------------
clip_group = project.main_group.find_subpath(CLIP_DIR_NAME, false)
if clip_group.nil?
  clip_group = project.main_group.new_group(CLIP_DIR_NAME, CLIP_DIR_NAME)
  puts "[+] PBXGroup '#{CLIP_DIR_NAME}' oluşturuldu"
else
  puts "[=] PBXGroup '#{CLIP_DIR_NAME}' zaten var"
end

# ---------------------------------------------------------------------------
# 2. HangelAppClip target'ı yarat / bul
# ---------------------------------------------------------------------------
clip_target = project.targets.find { |t| t.name == CLIP_TARGET_NAME }
if clip_target.nil?
  # xcodeproj gem'in new_target metodu :application için
  # com.apple.product-type.application üretir. App Clip için
  # product_type'ı manuel set etmemiz lazım.
  clip_target = project.new_target(
    :application,
    CLIP_TARGET_NAME,
    :ios,
    CLIP_DEPLOYMENT_TARGET,
    nil,
    :swift
  )
  clip_target.product_type = APP_CLIP_PRODUCT_TYPE
  puts "[+] Native target '#{CLIP_TARGET_NAME}' oluşturuldu (product_type=#{APP_CLIP_PRODUCT_TYPE})"
else
  # Var olan target'ın product_type'ı yanlışsa düzelt
  if clip_target.product_type != APP_CLIP_PRODUCT_TYPE
    clip_target.product_type = APP_CLIP_PRODUCT_TYPE
    puts "[~] product_type düzeltildi: #{APP_CLIP_PRODUCT_TYPE}"
  else
    puts "[=] Native target '#{CLIP_TARGET_NAME}' zaten var"
  end
end

# ---------------------------------------------------------------------------
# 3. Clip dosyalarını group + target'a ekle
# ---------------------------------------------------------------------------
def ensure_file_in_group_and_target(group, target, filename, source: true)
  ref = group.files.find { |f| f.path == filename }
  if ref.nil?
    ref = group.new_reference(filename)
    puts "[+] #{filename} group'a eklendi"
  end
  if source
    in_phase = target.source_build_phase.files_references.any? { |r| r.path == filename }
    unless in_phase
      target.add_file_references([ref])
      puts "[+] #{filename} target source phase'e eklendi"
    end
  end
  ref
end

CLIP_SWIFT_FILES.each do |fn|
  ensure_file_in_group_and_target(clip_group, clip_target, fn, source: true)
end

# Info.plist + entitlements — sadece referans, source phase'de değil.
[CLIP_INFO_PLIST, CLIP_ENTITLEMENTS].each do |fn|
  ref = clip_group.files.find { |f| f.path == fn }
  if ref.nil?
    clip_group.new_reference(fn)
    puts "[+] #{fn} referansı eklendi"
  end
end

# ---------------------------------------------------------------------------
# 4. Clip target build settings
# ---------------------------------------------------------------------------
clip_target.build_configurations.each do |config|
  bs = config.build_settings
  bs['PRODUCT_BUNDLE_IDENTIFIER'] = CLIP_BUNDLE_ID
  bs['PRODUCT_NAME'] = '$(TARGET_NAME)'
  bs['IPHONEOS_DEPLOYMENT_TARGET'] = CLIP_DEPLOYMENT_TARGET
  bs['SDKROOT'] = 'iphoneos'
  bs['TARGETED_DEVICE_FAMILY'] = '1,2' # 1=iPhone, 2=iPad
  bs['SUPPORTS_MACCATALYST'] = 'NO'
  bs['SUPPORTS_XR_DESIGNED_FOR_IPHONE_IPAD'] = 'NO'
  bs['INFOPLIST_FILE'] = "#{CLIP_DIR_NAME}/Info.plist"
  bs['CODE_SIGN_ENTITLEMENTS'] = "#{CLIP_DIR_NAME}/HangelAppClip.entitlements"
  bs['INFOPLIST_KEY_CFBundleDisplayName'] = 'Hangel'
  bs['INFOPLIST_KEY_UIApplicationSceneManifest_Generation'] = 'NO'
  bs['INFOPLIST_KEY_UILaunchScreen_Generation'] = 'YES'
  bs['INFOPLIST_KEY_UISupportedInterfaceOrientations'] = 'UIInterfaceOrientationPortrait'
  bs['ENABLE_PREVIEWS'] = 'YES'
  bs['SWIFT_VERSION'] = '5.0'
  bs['SWIFT_EMIT_LOC_STRINGS'] = 'YES'
  bs['CURRENT_PROJECT_VERSION'] = '1'
  bs['MARKETING_VERSION'] = '2.0.3'
  bs['DEVELOPMENT_TEAM'] = DEVELOPMENT_TEAM
  bs['CODE_SIGN_STYLE'] = 'Automatic'
  bs['GENERATE_INFOPLIST_FILE'] = 'NO' # Bizim Info.plist'imizi kullansın
  bs['LD_RUNPATH_SEARCH_PATHS'] = '$(inherited) @executable_path/Frameworks'
  # App Clip'i ana app'in product'undan ayır — embedded clip
  bs['SKIP_INSTALL'] = 'YES'
  bs['ASSETCATALOG_COMPILER_APPICON_NAME'] = 'AppIcon'
  # On-demand install için gerekli linker setting
  bs['ENABLE_ON_DEMAND_RESOURCES'] = 'NO'
end
puts "[=] App Clip target build settings uygulandı"

# ---------------------------------------------------------------------------
# 5. App target'a App Clip'i embed et (Embed App Clips phase)
# ---------------------------------------------------------------------------
# Önce target dependency kur.
already_dep = app_target.dependencies.any? { |d| d.target == clip_target }
unless already_dep
  app_target.add_dependency(clip_target)
  puts "[+] App target HangelAppClip'e depend ediyor"
end

# Embed App Clips phase var mı?
# dstSubfolderSpec = 16 ($(CONTENTS_FOLDER_PATH)/AppClips)
embed_phase = app_target.copy_files_build_phases.find { |p|
  p.name == 'Embed App Clips'
}
if embed_phase.nil?
  embed_phase = app_target.new_copy_files_build_phase('Embed App Clips')
  embed_phase.dst_subfolder_spec = '16' # $(CONTENTS_FOLDER_PATH)
  embed_phase.dst_path = '$(CONTENTS_FOLDER_PATH)/AppClips'
  puts "[+] Embed App Clips build phase eklendi"
end

clip_product = clip_target.product_reference
already_embedded = embed_phase.files_references.any? { |r| r == clip_product }
unless already_embedded
  build_file = embed_phase.add_file_reference(clip_product)
  build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
  puts "[+] HangelAppClip.app embed phase'e eklendi"
end

# ---------------------------------------------------------------------------
# 6. Save
# ---------------------------------------------------------------------------
project.save
puts "[OK] HangelAppClip target #{clip_target.uuid} kaydedildi"
puts "[OK] App.xcodeproj/project.pbxproj güncellendi"
puts ""
puts "Sonraki adımlar:"
puts "  1. Apple Developer Console'da Identifier oluştur: #{CLIP_BUNDLE_ID}"
puts "     → 'Parent App ID' = #{APP_BUNDLE_ID}"
puts "     → Capabilities: Associated Domains, App Groups, App Clips"
puts "  2. App Store Connect → My Apps → Hangel → App Clips → Advanced Experiences:"
puts "     URL: https://hangel.org.tr/clip/event/* (Action: Show)"
puts "  3. Backend: /api/clip/event/{id} ve /api/clip/checkin endpoint'leri ekle"
puts "  4. .well-known/apple-app-site-association'a appclips entry ekle:"
puts "     { \"appclips\": { \"apps\": [\"NKZNY8NU8S.#{CLIP_BUNDLE_ID}\"] } }"
