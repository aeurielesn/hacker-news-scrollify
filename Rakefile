#--
# Modified by Alexander Urieles
# Original from Silver Bird's Rakefile
#++

require 'crxmake'
require 'openssl'
require 'digest/sha2'
require 'json'
require 'jsmin'

class ExtensionInfo
  attr_reader :id, :name, :version
  def initialize public_key, path
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

  def generate_id public_key
    hex_id = Digest::SHA2.hexdigest(public_key)
    a_pos = 'a'.getbyte(0)
    hex_id[0...32].split('').map do |char|
      (char.hex + a_pos).chr
    end.join
  end
end

# from crxmake.rb
def key_algo 
  %w(30 81 9F 30 0D 06 09 2A 86 48 86 F7 0D 01 01 01 05 00 03 81 8D 00).map{|s| s.hex}.pack('C*')
end

module Constants
  KEY_FILE = "../hacker-news-scrollify.pem"
  IGNORE_DIR = /\.git|dist|build/
  IGNORE_FILE = /Rakefile|\.gitignore|\.crx$|\.zip$|\.project$|\.sublime-project$|\.sublime-workspace$|^updates\.xml$/
  KEY_ALGO = key_algo
  BUILD_DIR = "build"
end

# from crxmake
def read_key pkey 
  File.open(pkey, 'rb') do |io|
    key = OpenSSL::PKey::RSA.new(io)
  end
end

def current_branch
  `git branch` =~ /\* (.*)$/i
  current_branch = $1
end

def get_filename(extension, ext)
  File.expand_path("./dist/hacker_news_scrollify_#{extension.id}_#{extension.version}_#{current_branch}.#{ext}")
end

@crxmake_hash = {
  :ex_dir => Constants::BUILD_DIR,
  :pkey => Constants::KEY_FILE,
  :verbose => false,
  :ignorefile => Constants::IGNORE_FILE,
  :ignoredir => Constants::IGNORE_DIR
}

def make_crx(key_file)
  key = read_key key_file
  extension = ExtensionInfo.new(Constants::KEY_ALGO + key.public_key.to_der, ".")
  crxmake_hash = @crxmake_hash.dup
  crxmake_hash[:pkey] = key_file
  crxmake_hash[:crx_output] = get_filename(extension,'crx')
  CrxMake.make(crxmake_hash)
end

task :default => [:clean,:cp,:jsmin,:'pack:default']

task :clean do
  Dir["#{Constants::BUILD_DIR}/*"].each do |f|
    FileUtils.rm_r(f)
  end
end

task :cp do
  FileUtils.cp_r("_locales", "#{Constants::BUILD_DIR}")
  FileUtils.cp_r("assets", "#{Constants::BUILD_DIR}")
  FileUtils.cp("manifest.json", "#{Constants::BUILD_DIR}")
end

task :jsmin do
  # minify javascripts
  #FileUtils.mkdir("#{Constants::BUILD_DIR}/js")
  #Dir['js/*.js'].each do |input|
  #  File.open(input, 'r') do |i|
  #    File.open("#{Constants::BUILD_DIR}/#{input[0...-3]}.min.js", 'w') do |o|
  #      o << JSMin.minify(i)
  #    end
  #  end
  #end
  # use minified versions in html's
  #FileUtils.mkdir("#{Constants::BUILD_DIR}/views")
  #Dir['views/*.html'].each do |input|
  #  File.open("#{Constants::BUILD_DIR}/#{input}", 'w') do |o|
  #    o.puts File.read(input).gsub(/\.js/, '.min.js')
  #  end
  #end
end

namespace :pack do
  desc 'pack extension using main key'
  task :default do
    make_crx(Constants::KEY_FILE)
  end

  desc 'pack extension using a generated key'
  task :random do
    make_crx(nil)
  end
end

desc 'generate zip file for extension gallery'
task :zip => [:clean,:cp,:jsmin] do
  key = read_key Constants::KEY_FILE 
  extension = ExtensionInfo.new(Constants::KEY_ALGO + key.public_key.to_der, ".")
  crxmake_hash = @crxmake_hash.dup
  crxmake_hash[:zip_output] = get_filename(extension,'zip')
  CrxMake.zip(crxmake_hash)
end