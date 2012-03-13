#--
# Modified by Alexander Urieles
# Original from Silver Bird's Rakefile
#++

require 'crxmake'
require 'fileutils'
require 'digest/sha2'
require 'json'
require 'restclient'
require 'tempfile'

class CrxMake
  alias_method :orig_zip, :zip
  def zip
    orig_zip
    read_key
  end
  def public_key
    KEY + @key.public_key.to_der
  end
end

class ExtensionInfo
  attr_reader :id, :name, :version
  def initialize(public_key, path)
    @id = generate_id(public_key)
    @path = path
    load_manifest
  end

  private
  def load_manifest
    json_data = File.read(File.join(@path, 'manifest.json'))
    manifest_data = JSON.parse(json_data)
    @name = manifest_data['name']
    @version = manifest_data['version']
  end

  def generate_id(public_key)
    hex_id = Digest::SHA2.hexdigest(public_key)
    a_pos = 'a'.getbyte(0)
    hex_id[0...32].split('').map do |char|
      (char.hex + a_pos).chr
    end.join
  end
end

class GitHubInfo
  attr_reader :access_token
  def initialize(path)
    json_data = File.read(path)
    github_data = JSON.parse(json_data)
    @access_token = github_data['access_token']
  end
end

class DownloadsInfo
  attr_reader :name, :description, :content_type
  attr_reader :overwrite
  attr_accessor :size
  def initialize(name, description, content_type, overwrite)
    @name = name
    @description = description
    @content_type = content_type
    @overwrite = overwrite
  end
  
  def json(extension_info)
    {
      :name => @name % { :version => extension_info.version },
      :size => @size,
      :description => @description % { :version => extension_info.version },
      :content_type => @content_type
    }.to_json
  end
end

module Constants
  KEY_FILE = "../hacker-news-scrollify.pem"
  IGNORE_DIR = /^(?:\.git|dist)$/
  IGNORE_FILE = /^(?:Rakefile|\.gitignore|.*\.crx|.*\.zip|.*\.sublime-project|.*\.sublime-workspace|updates\.xml)$/
  TEMP_PACKAGE_FILE = Tempfile.new('Rakefile')
end

def current_branch
  `git branch` =~ /\* (.*)$/i
  current_branch = $1
end

def get_filename(extension_info, ext)
  "./dist/hacker-news-scrollify_#{extension_info.version}_#{current_branch}.#{ext}"
end

@crxmake_hash = {
  :ex_dir => ".",
  :crx_output => Constants::TEMP_PACKAGE_FILE,
  :zip_output => Constants::TEMP_PACKAGE_FILE,
  :verbose => false,
  :ignorefile => Constants::IGNORE_FILE,
  :ignoredir => Constants::IGNORE_DIR
}

def make_package(key_file, ext='crx', downloads_info=nil)
  crxmake_hash = @crxmake_hash.dup
  crxmake_hash[:pkey] = key_file
  extension = CrxMake.new(crxmake_hash)
  if ext == 'crx'
    extension.make
  else
    extension.zip
  end
  extension_info = ExtensionInfo.new(extension.public_key, ".")
  dest = get_filename(extension_info, ext)
  FileUtils.mv(Constants::TEMP_PACKAGE_FILE, dest)
  puts "Package generated: #{dest}"
  upload_github(extension_info, downloads_info, dest) if downloads_info
end

def upload_github(extension_info, downloads_info, upload_file)
  file = File.new(upload_file)
  downloads_info.size = file.size
  github_info = GitHubInfo.new("../github.token")
  response = RestClient.get "https://api.github.com/repos/aeurielesn/hacker-news-scrollify/downloads",
    :access_token => github_info.access_token
  unless response.code == 200
    raise "List downloads failed"
  end
  downloads_list = JSON.parse(response.body)
  downloads_list.each { |f|
    if f['name'] == downloads_info.name  % { :version => extension_info.version }
      if downloads_info.overwrite
        puts "File exists. Deleting #{downloads_info.name}"
        response = RestClient.delete "https://api.github.com/repos/aeurielesn/hacker-news-scrollify/downloads/#{f['id']}?access_token=#{github_info.access_token}"
        unless response.code == 204
          raise "File deletion failed"
        end
      else
        raise "File exists"
      end
    end 
  }
  puts "Package creation: #{downloads_info.name}"
  response = RestClient::Request.execute(
    :url => "https://api.github.com/repos/aeurielesn/hacker-news-scrollify/downloads?access_token=#{github_info.access_token}",
    :method => "post",
    :payload => downloads_info.json(extension_info)
  )
  unless response.code == 201
    raise "File creation failed"
  end
  file_created = JSON.parse(response.body)
  puts "Package uploading s3: #{downloads_info.name}"
  response = RestClient.post file_created['s3_url'],
    :key => file_created['path'],
    :acl => file_created['acl'],
    :success_action_status => '201',
    :Filename => file_created['name'],
    :AWSAccessKeyId => file_created['accesskeyid'],
    :Policy => file_created['policy'],
    :Signature => file_created['signature'],
    :'Content-Type' => file_created['mime_type'],
    :file => file
  unless response.code == 201
    raise "File upload failed"
  end
  puts "Package uploaded: #{downloads_info.name}"
end

task :default => :'pack:default'

namespace :pack do
  desc 'pack extension using main key'
  task :default do
    make_package(Constants::KEY_FILE)
    make_package(Constants::KEY_FILE, 'zip')
  end

  desc 'pack extension using a generated key'
  task :random do
    make_package(nil)
  end
end

desc 'generate zip file for extension gallery'
task :zip do
  make_package(Constants::KEY_FILE, 'zip')
end

namespace :upload do
  task :crx do
    downloads_info = DownloadsInfo.new('hacker_news_scrollify_%{version}.crx', 'v%{version}', 'application/x-chrome-extension', false)
    make_package(Constants::KEY_FILE, 'crx', downloads_info)
  end
  task :latest do
    downloads_info = DownloadsInfo.new('latest.crx', 'v%{version}', 'application/x-chrome-extension', true)
    make_package(Constants::KEY_FILE, 'crx', downloads_info)
  end
end