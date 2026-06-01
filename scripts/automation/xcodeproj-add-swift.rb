#!/usr/bin/env ruby
# Xcode project'e .swift dosyası ekle (App target'a).
#
# Kullanım:
#   ruby scripts/automation/xcodeproj-add-swift.rb HangelBackgroundTasksPlugin.swift
#
# Dosya zaten target'taysa atlanır (idempotent).

require 'xcodeproj'

PROJECT_PATH = File.expand_path('../../../ios/App/App.xcodeproj', __FILE__)
SOURCE_GROUP_PATH = 'App'  # ios/App/App/ folder

filename = ARGV[0]
unless filename
  puts "Usage: ruby xcodeproj-add-swift.rb <filename>"
  exit 1
end

project = Xcodeproj::Project.open(PROJECT_PATH)
app_target = project.targets.find { |t| t.name == 'App' }
unless app_target
  puts "ERROR: App target not found"
  exit 1
end

# Find the App group
app_group = project.main_group.find_subpath(SOURCE_GROUP_PATH, false)
unless app_group
  puts "ERROR: Group '#{SOURCE_GROUP_PATH}' not found"
  exit 1
end

# Check if file already in project
existing = app_group.files.find { |f| f.path == filename }
if existing
  # Already a file reference. Check build phase.
  in_build = app_target.source_build_phase.files_references.any? { |r| r.path == filename }
  if in_build
    puts "✅ #{filename} zaten target'ta."
    exit 0
  else
    puts "Adding existing file to build phase..."
    app_target.add_file_references([existing])
    project.save
    puts "✅ #{filename} build phase'e eklendi."
    exit 0
  end
end

# Add new file reference
file_ref = app_group.new_reference(filename)
app_target.add_file_references([file_ref])
project.save
puts "✅ #{filename} project + target'a eklendi."
