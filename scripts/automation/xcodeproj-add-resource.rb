#!/usr/bin/env ruby
require 'xcodeproj'

PROJECT = File.expand_path('../../../ios/App/App.xcodeproj', __FILE__)
filename = ARGV[0]
project = Xcodeproj::Project.open(PROJECT)
target = project.targets.find { |t| t.name == 'App' }
group = project.main_group.find_subpath('App', false)
existing = group.files.find { |f| f.path == filename }
if existing
  in_resources = target.resources_build_phase.files_references.any? { |r| r.path == filename }
  unless in_resources
    target.resources_build_phase.add_file_reference(existing)
    project.save
    puts "✅ #{filename} resources build phase'e eklendi."
  else
    puts "✅ #{filename} zaten resources'ta."
  end
else
  file_ref = group.new_reference(filename)
  target.resources_build_phase.add_file_reference(file_ref)
  project.save
  puts "✅ #{filename} project + resources phase'e eklendi."
end
