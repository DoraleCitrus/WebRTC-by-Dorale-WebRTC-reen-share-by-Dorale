# Dorale屏幕分享1.0使用文档

准备工作：一个具有公网ip的服务器，强烈推荐使用Linux系统，推荐Ubuntu Server系统，因为需要配置coturn服务器。下载并解压Release中的压缩包。

## 一、配置服务端

## 1.Linux服务器使用方法
Release中的压缩包中，server文件(没有后缀名)就是服务端的Linux的可执行文件。直接启动，输入端口即可运行。

## 2.Windows服务器使用方法
Release中的压缩包中，server.exe文件是服务端的Windows 的可执行文件。直接启动，输入端口即可运行。

## 二、设置 TURN 服务器 (coturn) 教程（公网屏幕分享才需要，局域网内不需要配置）

接下来将教学配置 TURN 服务器（使用 coturn），以Ubuntu Server系统为例。
如果你使用的是别的系统，如Windows Server或别的Linux发行版，请参照下面的内容或从网上自行查询方法。建议使用AI助手指导你。
建议使用Linux系统，因为coturn是基于Linux的，如果使用别的系统，可能需要docker或虚拟机等。

## 1. 安装 coturn

首先，更新你的包列表并安装 coturn：
```bash
sudo apt update
sudo apt install coturn
```

## 2. 配置 coturn

安装完成后，coturn 的主配置文件位于 `/etc/turnserver.conf`。执行以下命令编辑配置文件：

```bash
sudo nano /etc/turnserver.conf
```

在文件中修改：
(注意，这个配置文件默认所有内容为注释，对于你需要设置的项目，需要去除“#”取消注释)

### 2.1 设置监听端口

`coturn` 默认监听端口为 `3478`。你可以保持默认设置，也可以自定义端口：
```plaintext
listening-port=3478
```

### 2.2 设置公网 IP

确保 `coturn` 监听服务器的公网 IP 地址。找到 `external-ip` 配置项并设置：
```plaintext
external-ip=你的公网IP地址
```

### 2.3 设置中继 IP

将 `relay-ip` 设置为服务器的公网 IP：
```plaintext
relay-ip=你的公网IP地址
```

### 2.4 启用认证机制

为了提高安全性，你可以启用用户名和密码认证。修改或添加如下配置：
```plaintext
lt-cred-mech
user=username:password  # 替换为自定义的用户名和密码
```

### 2.5 设置 realm

`realm` 用于标识 TURN 服务器，通常设置为你服务器的域名，如没有域名，输入公网 IP即可：
```plaintext
realm=yourdomain.com  # 或者替换为你的公网 IP
```

保存并关闭文件。

## 3. 配置防火墙

确保服务器的防火墙允许通过 TURN 端口。使用 `ufw` 来配置防火墙：
```bash
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
```

## 4. 启动并启用 coturn

确保 coturn 在系统启动时自动启动并立即运行：
```bash
sudo systemctl enable coturn
sudo systemctl start coturn
```

你可以使用以下命令检查 coturn 服务是否正常运行：
```bash
sudo systemctl status coturn
```

## 5. 结束

完成以上步骤后，WebRTC 应用就可以使用配置的 TURN 服务器来进行跨局域网通信了。

## 三、启动客户端

## 1.启动客户端
用chrome或者edge浏览器启动index.html。之后输入服务器的ip地址，端口，turn服务器端口，用户名，密码即可。（如果局域网内屏幕分享有关turn服务器的内容可以随意填写）

## 2.选择角色
接下来会有选择角色按钮。请让接收屏幕分享的一方先选择我是接受者。然后让发送屏幕分享的一方选择我是发送者。

## 3.开始屏幕分享
选择发送者的一方会有弹窗出现，让用户选择屏幕分享的规格（包括分辨率，帧率，码率），确认后选择屏幕分享内容即可开始。

