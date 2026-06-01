#!/usr/bin/env ruby
# add-live-activities-target.rb — HangelLiveActivities (Widget Extension) target'ını
# App.xcodeproj'a idempotent ekler.
#
# Widget Extension = iOS 16.1+ Live Activity Lock Screen + Dynamic Island UI'larını
# barındıran ayrı bir target. ActivityKit Attributes (HangelLiveActivityAttributes.swift)
# hem App hem bu target'tan paylaşılmalı (Target Membership multi-target).
#
# Yaptıkları:
#   1. `HangelLiveActivities` PBXGroup'unu main_group altında oluşturur (yoksa).
#   2. `ios/App/HangelLiveActivities/` altındaki .swift dosyalarını gruba ekler.
#   3. `Info.plist` + `HangelLiveActivities.entitlements` referansını ekler.
#   4. `HangelLiveActivities` adlı yeni native target oluşturur:
#        - product type: com.apple.product-type.app-extension
#        - SDK: iphoneos
#        - iOS deployment target: 16.1 (Live Activities)
#        - Bundle ID: com.hangel.ios.app.LiveActivities
#        - Parent App ID: com.hangel.ios.app
#        - SwiftUI lifecycle
#   5. `HangelLiveActivityAttributes.swift` dosyasını HEM App HEM widget target
#      source phase'ine ekler (Target Membership shared).
#   6. App target'a "Embed Foundation Extensions" copy phase ekler + dependency.
#   7. Widget target'a WidgetKit + SwiftUI framework dependency'leri.
#
# Kullanım:
#   ruby scripts/automation/add-live-activities-target.rb
#
# Idempotent: tekrar tekrar çalıştırılabilir, mevcut dosyaları/target'ı
# duplicate etmez. Çalıştırmadan önce pbxproj backup commit'i yapmak önerilir.
#
# Referans: scripts/automation/add-watch-target.rb (watchOS target ekleme örneği)
#           scripts/automation/add-appclip-target.rb (App Clip target örneği)

require 'xcodeproj'

ROOT = File.expand_path('../../..', __FILE__)
PROJECT_PATH = File.join(ROOT, 'ios', 'App', 'App.xcodeproj')
LA_DIR_NAME = 'HangelLiveActivities'
LA_DIR_FS = File.join(ROOT, 'ios', 'App', LA_DIR_NAME)
LA_TARGET_NAME = 'HangelLiveActivities'
LA_BUNDLE_ID = 'com.hangel.ios.app.LiveActivities'
APP_BUNDLE_ID = 'com.hangel.ios.app'
LA_SWIFT_FILES = %w[
  HangelLiveActivities.swift
  EmergencyBloodLiveActivity.swift
  VolunteerTaskLiveActivity.swift
  EventCountdownLiveActivity.swift
  DonationCampaignLiveActivity.swift
].freeze
LA_INFO_PLIST = 'Info.plist'
LA_ENTITLEMENTS = 'HangelLiveActivities.entitlements'
LA_DEPLOYMENT_TARGET = '16.1'
DEVELOPMENT_TEAM = 'NKZNY8NU8S'

# Attributes dosyası ana App target'ta yaşar, ama widget extension da
# aynı tip tanımlarını kullandığı için iki target'ın da source phase'ine
# eklenmeli (multi-target file membership).
SHARED_ATTRIBUTES_FILE = 'HangelLiveActivityAttributes.swift' # path: App/HangelLiveActivityAttributes.swift

# Aynı runtime'da App target'a eklenmesi gereken Hangel plugin'leri.
# (Widget Extension'la ilgili değil ama bu script "iOS native v1 bootstrap"
# göreviyle aynı koşumda çalıştığı için burada konsolide.)
APP_ONLY_PLUGIN_FILES = %w[
  HangelLiveActivityPlugin.swift
  HangelSilentPushPlugin.swift
].freeze

# Widget extension product type — Xcode "Widget Extension" template'iyle aynı.
APP_EXTENSION_PRODUCT_TYPE = 'com.apple.product-type.app-extension'

project = Xcodeproj::Project.open(PROJECT_PATH)
app_target = project.targets.find { |t| t.name == 'App' }
abort 'ERROR: App target not found' unless app_target

# ---------------------------------------------------------------------------
# 1. HangelLiveActivities group'unu yarat / bul
# ---------------------------------------------------------------------------
la_group = project.main_group.find_subpath(LA_DIR_NAME, false)
if la_group.nil?
  la_group = project.main_group.new_group(LA_DIR_NAME, LA_DIR_NAME)
  puts "[+] PBXGroup '#{LA_DIR_NAME}' oluşturuldu"
else
  puts "[=] PBXGroup '#{LA_DIR_NAME}' zaten var"
end

# ---------------------------------------------------------------------------
# 2. HangelLiveActivities target'ı yarat / bul
# ---------------------------------------------------------------------------
la_target = project.targets.find { |t| t.name == LA_TARGET_NAME }
if la_target.nil?
  # xcodeproj gem'in :app_extension symbolünü kullan
  la_target = project.new_target(
    :app_extension,
    LA_TARGET_NAME,
    :ios,
    LA_DEPLOYMENT_TARGET,
    nil,
    :swift
  )
  la_target.product_type = APP_EXTENSION_PRODUCT_TYPE
  puts "[+] Native target '#{LA_TARGET_NAME}' oluşturuldu (product_type=#{APP_EXTENSION_PRODUCT_TYPE})"
else
  if la_target.product_type != APP_EXTENSION_PRODUCT_TYPE
    la_target.product_type = APP_EXTENSION_PRODUCT_TYPE
    puts "[~] product_type düzeltildi: #{APP_EXTENSION_PRODUCT_TYPE}"
  else
    puts "[=] Native target '#{LA_TARGET_NAME}' zaten var"
  end
end

# ---------------------------------------------------------------------------
# 3. Widget dosyalarını group + target'a ekle
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
      puts "[+] #{filename} #{target.name} source phase'e eklendi"
    end
  end
  ref
end

LA_SWIFT_FILES.each do |fn|
  ensure_file_in_group_and_target(la_group, la_target, fn, source: true)
end

# Info.plist + entitlements — sadece referans, source phase'de değil.
[LA_INFO_PLIST, LA_ENTITLEMENTS].each do |fn|
  ref = la_group.files.find { |f| f.path == fn }
  if ref.nil?
    la_group.new_reference(fn)
    puts "[+] #{fn} referansı eklendi"
  end
end

# ---------------------------------------------------------------------------
# 4. SHARED ATTRIBUTES — App target'taki ActivityAttributes dosyasını
#    widget target'ın source phase'ine de ekle (multi-target membership).
# ---------------------------------------------------------------------------
# Önce App group'unda bul / oluştur
app_group = project.main_group.find_subpath('App', false)
abort 'ERROR: App group not found' unless app_group
attributes_ref = app_group.files.find { |f| f.path == SHARED_ATTRIBUTES_FILE }
if attributes_ref.nil?
  attributes_ref = app_group.new_reference(SHARED_ATTRIBUTES_FILE)
  puts "[+] #{SHARED_ATTRIBUTES_FILE} App group'a eklendi"
end

# App target source phase'inde var mı?
already_in_app_sources = app_target.source_build_phase.files_references.any? { |r|
  r.path == SHARED_ATTRIBUTES_FILE
}
unless already_in_app_sources
  app_target.add_file_references([attributes_ref])
  puts "[+] #{SHARED_ATTRIBUTES_FILE} App target source phase'e eklendi"
end

# Widget extension target source phase'inde var mı?
already_in_la_sources = la_target.source_build_phase.files_references.any? { |r|
  r.path == SHARED_ATTRIBUTES_FILE
}
unless already_in_la_sources
  la_target.add_file_references([attributes_ref])
  puts "[+] #{SHARED_ATTRIBUTES_FILE} #{LA_TARGET_NAME} source phase'e eklendi (shared membership)"
end

# App-only plugin'leri (HangelLiveActivityPlugin, HangelSilentPushPlugin) App
# target'a ekle. Idempotent.
APP_ONLY_PLUGIN_FILES.each do |fn|
  ref = app_group.files.find { |f| f.path == fn }
  if ref.nil?
    ref = app_group.new_reference(fn)
    puts "[+] #{fn} App group'a eklendi"
  end
  in_phase = app_target.source_build_phase.files_references.any? { |r| r.path == fn }
  unless in_phase
    app_target.add_file_references([ref])
    puts "[+] #{fn} App target source phase'e eklendi"
  end
end

# ---------------------------------------------------------------------------
# 5. Widget target build settings
# ---------------------------------------------------------------------------
la_target.build_configurations.each do |config|
  bs = config.build_settings
  bs['PRODUCT_BUNDLE_IDENTIFIER'] = LA_BUNDLE_ID
  bs['PRODUCT_NAME'] = '$(TARGET_NAME)'
  bs['IPHONEOS_DEPLOYMENT_TARGET'] = LA_DEPLOYMENT_TARGET
  bs['SDKROOT'] = 'iphoneos'
  bs['TARGETED_DEVICE_FAMILY'] = '1,2' # 1=iPhone, 2=iPad
  bs['SUPPORTS_MACCATALYST'] = 'NO'
  bs['SUPPORTS_XR_DESIGNED_FOR_IPHONE_IPAD'] = 'NO'
  bs['INFOPLIST_FILE'] = "#{LA_DIR_NAME}/Info.plist"
  bs['CODE_SIGN_ENTITLEMENTS'] = "#{LA_DIR_NAME}/HangelLiveActivities.entitlements"
  bs['INFOPLIST_KEY_CFBundleDisplayName'] = 'Hangel'
  bs['INFOPLIST_KEY_NSHumanReadableCopyright'] = 'Hangel'
  bs['ENABLE_PREVIEWS'] = 'YES'
  bs['SWIFT_VERSION'] = '5.0'
  bs['SWIFT_EMIT_LOC_STRINGS'] = 'YES'
  bs['CURRENT_PROJECT_VERSION'] = '1'
  bs['MARKETING_VERSION'] = '2.0.3'
  bs['DEVELOPMENT_TEAM'] = DEVELOPMENT_TEAM
  bs['CODE_SIGN_STYLE'] = 'Automatic'
  bs['GENERATE_INFOPLIST_FILE'] = 'NO' # Bizim Info.plist'imizi kullansın
  bs['LD_RUNPATH_SEARCH_PATHS'] = '$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks'
  bs['SKIP_INSTALL'] = 'YES'
  bs['ASSETCATALOG_COMPILER_APPICON_NAME'] = 'AppIcon'
  # Widget extension için özel ayarlar
  bs['MTL_ENABLE_DEBUG_INFO'] = 'INCLUDE_SOURCE'
  bs['MTL_FAST_MATH'] = 'YES'
end
puts "[=] Widget Extension target build settings uygulandı"

# ---------------------------------------------------------------------------
# 6. App target'a Widget Extension'ı embed et (Embed Foundation Extensions)
# ---------------------------------------------------------------------------
already_dep = app_target.dependencies.any? { |d| d.target == la_target }
unless already_dep
  app_target.add_dependency(la_target)
  puts "[+] App target HangelLiveActivities'e depend ediyor"
end

# Embed Foundation Extensions phase var mı?
# dstSubfolderSpec = 13 (PlugIns) — Foundation extensions için standart
embed_phase = app_target.copy_files_build_phases.find { |p|
  p.name == 'Embed Foundation Extensions' || p.symbol_dst_subfolder_spec == :plug_ins
}
if embed_phase.nil?
  embed_phase = app_target.new_copy_files_build_phase('Embed Foundation Extensions')
  embed_phase.symbol_dst_subfolder_spec = :plug_ins
  puts "[+] Embed Foundation Extensions build phase eklendi"
end

la_product = la_target.product_reference
already_embedded = embed_phase.files_references.any? { |r| r == la_product }
unless already_embedded
  build_file = embed_phase.add_file_reference(la_product)
  build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
  puts "[+] HangelLiveActivities.appex embed phase'e eklendi"
end

# ---------------------------------------------------------------------------
# 7. Save
# ---------------------------------------------------------------------------
project.save
puts "[OK] HangelLiveActivities target #{la_target.uuid} kaydedildi"
puts "[OK] App.xcodeproj/project.pbxproj güncellendi"
puts ""
puts "Sonraki adımlar (Xcode):"
puts "  1. Apple Developer Console'da Identifier oluştur: #{LA_BUNDLE_ID}"
puts "     → Capabilities: App Groups (group.com.hangel.app.shared)"
puts "  2. Xcode → HangelLiveActivities target → Signing & Capabilities:"
puts "     → 'App Groups' ekle (group.com.hangel.app.shared)"
puts "     → Provisioning profile'ı seç"
puts "  3. App target Info.plist'te NSSupportsLiveActivities=YES (zaten var)"
puts "  4. Run scheme'e HangelLiveActivities ekleyip preview ile test et"
puts "  5. Gerçek cihazda iOS 16.1+ ile Dynamic Island (iPhone 14 Pro+) test"
