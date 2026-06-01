#!/usr/bin/env ruby
# add-watch-target.rb — HangelWatch (watchOS 10+) target'ını App.xcodeproj'a
# idempotent ekler.
#
# Yaptıkları:
#   1. `HangelWatch` PBXGroup'unu main_group altında oluşturur (yoksa).
#   2. `ios/App/HangelWatch/` altındaki .swift dosyalarını grouba ekler.
#   3. `Info.plist` referansını ekler.
#   4. `HangelWatch` adlı yeni native target oluşturur:
#        - product type: com.apple.product-type.application
#        - SDK: watchos
#        - watchOS deployment target: 10.0
#        - Bundle ID: com.hangel.ios.app.watchapp
#        - Companion iPhone bundle ID: com.hangel.ios.app
#        - SwiftUI WatchKit lifecycle (no storyboard)
#   5. App target'a "Embed Watch Content" copy phase ekler + dependency kurar.
#   6. iPhone target'ın source phase'ine HangelWatchConnectivityPlugin.swift'i
#      ekler (zaten ekli değilse).
#
# Kullanım:
#   ruby scripts/automation/add-watch-target.rb
#
# Idempotent: tekrar tekrar çalıştırılabilir, mevcut dosyaları/target'ı duplicate
# etmez. Çalıştırmadan önce pbxproj backup commit'i yapmak önerilir.

require 'xcodeproj'

ROOT = File.expand_path('../../..', __FILE__)
PROJECT_PATH = File.join(ROOT, 'ios', 'App', 'App.xcodeproj')
WATCH_DIR_NAME = 'HangelWatch'
WATCH_DIR_FS = File.join(ROOT, 'ios', 'App', WATCH_DIR_NAME)
WATCH_TARGET_NAME = 'HangelWatch'
WATCH_BUNDLE_ID = 'com.hangel.ios.app.watchapp'
APP_BUNDLE_ID = 'com.hangel.ios.app'
WATCH_SWIFT_FILES = %w[
  HangelWatchApp.swift
  ContentView.swift
  EmergencyBloodDetailView.swift
  WatchAppDelegate.swift
  WatchConnectivityManager.swift
].freeze
WATCH_INFO_PLIST = 'Info.plist'
WATCH_DEPLOYMENT_TARGET = '10.0'
DEVELOPMENT_TEAM = 'NKZNY8NU8S'

IPHONE_BRIDGE_FILE = 'HangelWatchConnectivityPlugin.swift'

project = Xcodeproj::Project.open(PROJECT_PATH)
app_target = project.targets.find { |t| t.name == 'App' }
abort 'ERROR: App target not found' unless app_target

# ---------------------------------------------------------------------------
# 1. Bridge plugin'i iPhone App target'ına ekle
# ---------------------------------------------------------------------------
app_group = project.main_group.find_subpath('App', false)
abort 'ERROR: App group not found' unless app_group

bridge_ref = app_group.files.find { |f| f.path == IPHONE_BRIDGE_FILE }
if bridge_ref.nil?
  bridge_ref = app_group.new_reference(IPHONE_BRIDGE_FILE)
end
already_in_iphone_sources = app_target.source_build_phase.files_references.any? { |r| r.path == IPHONE_BRIDGE_FILE }
unless already_in_iphone_sources
  app_target.add_file_references([bridge_ref])
  puts "[+] App target'ına #{IPHONE_BRIDGE_FILE} eklendi"
else
  puts "[=] #{IPHONE_BRIDGE_FILE} App target'ında zaten var"
end

# ---------------------------------------------------------------------------
# 2. HangelWatch group'unu yarat / bul
# ---------------------------------------------------------------------------
watch_group = project.main_group.find_subpath(WATCH_DIR_NAME, false)
if watch_group.nil?
  watch_group = project.main_group.new_group(WATCH_DIR_NAME, WATCH_DIR_NAME)
  puts "[+] PBXGroup '#{WATCH_DIR_NAME}' oluşturuldu"
else
  puts "[=] PBXGroup '#{WATCH_DIR_NAME}' zaten var"
end

# ---------------------------------------------------------------------------
# 3. HangelWatch target'ı yarat / bul
# ---------------------------------------------------------------------------
watch_target = project.targets.find { |t| t.name == WATCH_TARGET_NAME }
if watch_target.nil?
  watch_target = project.new_target(
    :application,
    WATCH_TARGET_NAME,
    :watchos,
    WATCH_DEPLOYMENT_TARGET,
    nil,
    :swift
  )
  puts "[+] Native target '#{WATCH_TARGET_NAME}' oluşturuldu"
else
  puts "[=] Native target '#{WATCH_TARGET_NAME}' zaten var"
end

# ---------------------------------------------------------------------------
# 4. Watch dosyalarını group + target'a ekle
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

WATCH_SWIFT_FILES.each do |fn|
  ensure_file_in_group_and_target(watch_group, watch_target, fn, source: true)
end

# Info.plist source phase'e değil sadece referans olarak ekle.
info_plist_ref = watch_group.files.find { |f| f.path == WATCH_INFO_PLIST }
if info_plist_ref.nil?
  info_plist_ref = watch_group.new_reference(WATCH_INFO_PLIST)
  puts "[+] Info.plist referansı eklendi"
end

# ---------------------------------------------------------------------------
# 5. Watch target build settings
# ---------------------------------------------------------------------------
watch_target.build_configurations.each do |config|
  bs = config.build_settings
  bs['PRODUCT_BUNDLE_IDENTIFIER'] = WATCH_BUNDLE_ID
  bs['PRODUCT_NAME'] = '$(TARGET_NAME)'
  bs['WATCHOS_DEPLOYMENT_TARGET'] = WATCH_DEPLOYMENT_TARGET
  bs['SDKROOT'] = 'watchos'
  bs['TARGETED_DEVICE_FAMILY'] = '4' # 4 = Apple Watch
  bs['SUPPORTS_MACCATALYST'] = 'NO'
  bs['SUPPORTS_XR_DESIGNED_FOR_IPHONE_IPAD'] = 'NO'
  bs['INFOPLIST_FILE'] = "#{WATCH_DIR_NAME}/Info.plist"
  bs['INFOPLIST_KEY_UIApplicationSceneManifest_Generation'] = 'YES'
  bs['INFOPLIST_KEY_UILaunchScreen_Generation'] = 'YES'
  bs['INFOPLIST_KEY_CFBundleDisplayName'] = 'Hangel'
  bs['INFOPLIST_KEY_WKCompanionAppBundleIdentifier'] = APP_BUNDLE_ID
  bs['INFOPLIST_KEY_WKApplication'] = 'YES'
  bs['INFOPLIST_KEY_WKWatchOnly'] = 'NO'
  bs['INFOPLIST_KEY_WKRunsIndependentlyOfCompanionApp'] = 'NO'
  bs['ENABLE_PREVIEWS'] = 'YES'
  bs['SWIFT_VERSION'] = '5.0'
  bs['SWIFT_EMIT_LOC_STRINGS'] = 'YES'
  bs['CURRENT_PROJECT_VERSION'] = '1'
  bs['MARKETING_VERSION'] = '2.0.3'
  bs['DEVELOPMENT_TEAM'] = DEVELOPMENT_TEAM
  bs['CODE_SIGN_STYLE'] = 'Automatic'
  bs['GENERATE_INFOPLIST_FILE'] = 'NO' # Bizim Info.plist'imizi kullansın
  bs['LD_RUNPATH_SEARCH_PATHS'] = '$(inherited) @executable_path/Frameworks'
end
puts "[=] Watch target build settings uygulandı"

# ---------------------------------------------------------------------------
# 6. App target'a Watch'ı embed et (Embed Watch Content phase)
# ---------------------------------------------------------------------------
# Önce target dependency kur.
already_dep = app_target.dependencies.any? { |d| d.target == watch_target }
unless already_dep
  app_target.add_dependency(watch_target)
  puts "[+] App target HangelWatch'a depend ediyor"
end

# Embed phase var mı?
embed_phase = app_target.copy_files_build_phases.find { |p|
  p.name == 'Embed Watch Content' || p.symbol_dst_subfolder_spec == :plug_ins
}
if embed_phase.nil?
  embed_phase = app_target.new_copy_files_build_phase('Embed Watch Content')
  embed_phase.dst_subfolder_spec = '16' # $(CONTENTS_FOLDER_PATH)/Watch
  embed_phase.dst_path = '$(CONTENTS_FOLDER_PATH)/Watch'
  puts "[+] Embed Watch Content build phase eklendi"
end

watch_product = watch_target.product_reference
already_embedded = embed_phase.files_references.any? { |r| r == watch_product }
unless already_embedded
  build_file = embed_phase.add_file_reference(watch_product)
  build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
  puts "[+] HangelWatch.app embed phase'e eklendi"
end

# ---------------------------------------------------------------------------
# 7. Save
# ---------------------------------------------------------------------------
project.save
puts "[OK] HangelWatch target #{watch_target.uuid} kaydedildi"
puts "[OK] App.xcodeproj/project.pbxproj güncellendi"
