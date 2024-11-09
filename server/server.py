import asyncio
import json
import websockets

# 存储连接的 WebSocket 客户端，每个房间维护一个客户端列表
connected_clients = {}

# websocket 是客户端的 WebSocket 连接对象，path 是客户端请求的路径
async def register_client(websocket, path):
    """
    注册新的客户端并处理连接
    """
    # 获取房间名称，假设路径格式为 /room_name/...
    room_name = path.strip('/').split('/')[0]

    # 如果房间名称不存在于 connected_clients 字典中，创建一个新的房间列表
    if room_name not in connected_clients:
        connected_clients[room_name] = []

    # 将新连接的客户端添加到房间的客户端列表中
    connected_clients[room_name].append(websocket)

    try:
        # 接收客户端发来的消息并处理
        async for message in websocket:
            data = json.loads(message)

            # 根据消息类型进行不同的处理
            if data['type'] == 'create' or data['type'] == 'join':
                # 创建房间或加入房间时广播消息给其他客户端
                await notify_clients(room_name, data)
            elif data['type'] in ['offer', 'answer', 'ice']:
                # 处理 WebRTC 消息，转发给房间内的其他客户端
                await forward_message(room_name, data, websocket)

    except websockets.ConnectionClosed:
        # 客户端断开连接时输出日志
        print(f'客户端 {websocket} 断开连接')
    finally:
        # 移除断开连接的客户端
        if websocket in connected_clients[room_name]:
            connected_clients[room_name].remove(websocket)

async def notify_clients(room_name, data):
    """
    广播消息给房间内的所有客户端（除了发送者）
    """
    for client in connected_clients[room_name]:
        if client != data['sender']:
            await client.send(json.dumps(data))

async def forward_message(room_name, data, sender):
    """
    将消息转发给房间内的所有客户端（除了发送者）
    """
    for client in connected_clients[room_name]:
        if client != sender:
            await client.send(json.dumps(data))

async def main():
    """
    主函数：启动 WebSocket 服务器并等待客户端连接
    """
    my_port = int(input("请输入端口: "))  # 获取的端口
    server = await websockets.serve(register_client, '0.0.0.0', my_port)
    print("服务器已启动，等待客户端连接...")
    await server.wait_closed()

if __name__ == '__main__':
    # 启动服务器
    asyncio.run(main())
