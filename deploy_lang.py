#!/usr/bin/env python3
import os
import sys
import datetime
import paramiko

# Configuration
HOST = "138.16.225.102"
USER = "root"
KEY_FILE = "/Users/bul82/.ssh/catalog_zoj_vps"
PROJECT_NAME = "land-lang"
LOCAL_DIR = "/Users/bul82/Documents/Land_Lang"

def run_command_over_ssh(ssh_client, cmd):
    print(f"Running remote command: {cmd}")
    stdin, stdout, stderr = ssh_client.exec_command(cmd)
    exit_status = stdout.channel.recv_exit_status()
    out_text = stdout.read().decode().strip()
    err_text = stderr.read().decode().strip()
    if exit_status != 0:
        print(f"Command failed with exit code {exit_status}")
        if err_text:
            print(f"Error output:\n{err_text}")
    return exit_status, out_text, err_text

def deploy():
    print("=== Land Liberty Academy VPS Deployment ===")
    
    # 1. Establish SSH connection bypassing the VPN
    print("\nConnecting to VPS using physical interface en0 routing bypass...")
    try:
        proxy = paramiko.ProxyCommand(f'nc -b en0 {HOST} 22')
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        # Load the private key
        pkey = paramiko.Ed25519Key.from_private_key_file(KEY_FILE)
        
        ssh.connect(
            hostname=HOST,
            username=USER,
            pkey=pkey,
            sock=proxy,
            timeout=15
        )
        print("Successfully connected to VPS SSH server!")
    except Exception as e:
        print(f"SSH connection failed: {e}")
        sys.exit(1)
        
    # 2. Create release directories
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    remote_base_dir = f"/var/www/landings/{PROJECT_NAME}"
    remote_release_dir = f"{remote_base_dir}/releases/{timestamp}"
    
    print(f"\nCreating release directory on server: {remote_release_dir}")
    run_command_over_ssh(ssh, f"mkdir -p {remote_release_dir}/assets")
    run_command_over_ssh(ssh, f"mkdir -p {remote_release_dir}/cms")
    
    # 3. Upload files via SFTP
    print("\nUploading project code and assets via SFTP...")
    try:
        sftp = ssh.open_sftp()
        
        # Upload main HTML & CSS & JS
        files_to_upload = ["index.html",
    "privacy.html", "style.css", "app.js", "admin.html", "content.json"]
        for f in files_to_upload:
            local_path = os.path.join(LOCAL_DIR, f)
            remote_path = f"{remote_release_dir}/{f}"
            print(f"Uploading: {f} -> {remote_path}")
            sftp.put(local_path, remote_path)
            
        # Upload assets (images and js helper libraries like lucide.min.js)
        local_assets = os.path.join(LOCAL_DIR, "assets")
        if os.path.exists(local_assets):
            for f in os.listdir(local_assets):
                if f.endswith((".jpg", ".png", ".webp", ".js")):
                    local_path = os.path.join(local_assets, f)
                    remote_path = f"{remote_release_dir}/assets/{f}"
                    print(f"Uploading asset: assets/{f}")
                    sftp.put(local_path, remote_path)
            
        # Upload CMS server.py
        local_cms_server = os.path.join(LOCAL_DIR, "cms", "server.py")
        if os.path.exists(local_cms_server):
            remote_cms_path = f"{remote_release_dir}/cms/server.py"
            print(f"Uploading CMS server: cms/server.py -> {remote_cms_path}")
            sftp.put(local_cms_server, remote_cms_path)

        sftp.close()
        print("All assets uploaded successfully!")
    except Exception as e:
        print(f"SFTP upload failed: {e}")
        ssh.close()
        sys.exit(1)
        
    # 4. Update symlink to point to the new release
    print("\nUpdating symlinks...")
    current_symlink = f"{remote_base_dir}/current"
    symlink_cmd = f"ln -sfn releases/{timestamp} {current_symlink}"
    exit_status, _, _ = run_command_over_ssh(ssh, symlink_cmd)
    
    if exit_status == 0:
        print(f"Deployment successful! Symlink updated: {current_symlink} -> releases/{timestamp}")
    else:
        print("Failed to update symlink on remote VPS.")
        ssh.close()
        sys.exit(1)
        
    # 5. Fix permissions for www-data
    print("\nSetting ownership permissions on remote server...")
    run_command_over_ssh(ssh, f"chown -R www-data:www-data {remote_base_dir}")
    
    # 6. Restart the CMS systemd service
    print("\nRestarting Liberty English Academy CMS Backend service...")
    run_command_over_ssh(ssh, "systemctl daemon-reload")
    run_command_over_ssh(ssh, "systemctl restart land-lang-cms.service")
        
    ssh.close()
    print("\n=== Land Liberty Academy VPS Deployment Completed Successfully! ===")
    print(f"Live URL: https://bul82info.ru/land-lang/")

if __name__ == "__main__":
    deploy()
