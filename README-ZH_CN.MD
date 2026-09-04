# 抽奖程序

**本项目已基于 Vue 3 + Vite 重构**

年会抽奖程序，3D 球体抽奖，支持奖品信息配置，参与抽奖人员信息`Excel`导入，抽奖结果`Excel`导出

如果该程序对你有帮助😎😎😎，希望给个⭐**star**⭐喔。😘😘😘😍🥰🎉🎈🎃

> 立即体验一下： [https://moshang-ax.github.io/lottery/](https://moshang-ax.github.io/lottery/)

## 技术

前端：Vue 3 + Vite + Three.js（CSS3D）
后端：Node + Express

- 前端基于 **Vue 3** 组件化重构，构建工具由 webpack 迁移至 **Vite**，冷启动与热更新体验更好
- 3D 抽奖球使用 **Three.js** 的 CSS3D 渲染实现；为保证界面效果与原版一致，`Three.js` 及相关辅助库（`CSS3DRenderer.js`、`TrackballControls.js`、`tween.js`）仍以全局脚本方式从 `product/public/lib` 引入
- 数据服务由 **Express** 提供，接口契约与旧版保持一致，未做破坏性变更

## 功能描述：

1. 可将抽奖结果进行保存实时下载到 excel 中🎉
2. 已抽取人员不在参与抽取，抽中的人员不在现场可以重新抽取🎁
3. 刷新或者关掉服务器，会保存当前已抽取的数据，不会进行数据重置，只有点击界面上的重置按钮，才能重置抽奖数据🧧
4. 每次抽取的奖品数目可配置🎈
5. 抽取完所有奖品后还可以继续抽取特别奖(例如：现在抽取红包，追加的奖品等)，此时默认一次抽取一个🧨

## 预览

![lottery.gif](https://raw.githubusercontent.com/moshang-xc/blog/master/share/lottery.gif)

![index.jpg](https://raw.githubusercontent.com/moshang-xc/blog/master/share/index.jpg)

![start.jpg](https://raw.githubusercontent.com/moshang-xc/blog/master/share/start.jpg)

![end.jpg](https://raw.githubusercontent.com/moshang-xc/blog/master/share/end.jpg)

## 安装

```
git clone https://github.com/moshang-xc/lottery.git

cd lottery

# 服务端插件安装
cd server
npm install

# 前端插件安装
cd ../product
npm install

# 打包（生成 dist 产物，供 npm run serve 部署）
npm run build

# 运行（Express 托管 dist，初始端口 8888，端口被占用时自动切换并打印实际端口）
npm run serve

# 开发调试（Vite 开发服务默认 9000，自动拉起 Express 数据服务，端口占用均会自选空闲端口）
npm run dev

```

## 目录结构

```
Lottery
├── product                          # 前端（Vue 3 + Vite）
│   ├── index.html                   # Vite 入口页面
│   ├── vite.config.js               # 构建 / 开发服务配置（含数据服务端口探测）
│   ├── public                       # 静态资源，构建时原样拷贝
│   │   ├── img                      # 奖品图片
│   │   ├── css                      # 全局样式
│   │   ├── data
│   │   └── lib                      # three.js / CSS3DRenderer / tween 等全局库
│   └── src
│       ├── main.js                  # 应用入口
│       ├── App.vue
│       ├── api
│       │   └── index.js             # 后端接口请求封装
│       ├── lottery                  # 抽奖核心逻辑（3D 引擎、抽奖状态）
│       │   ├── engine.js            # 3D 名牌球引擎（Three.js CSS3D）
│       │   ├── store.js             # 全局响应式状态
│       │   ├── config.js
│       │   └── index.css
│       └── components               # Vue 组件
│           ├── ControlPanel.vue
│           ├── MusicControl.vue
│           ├── PrizeBar.vue
│           ├── QipaoList.vue
│           └── StarCanvas.vue
└── server                           # 后端（Express 数据服务）
    ├── config.js                    # 奖品信息配置
    ├── server.js                    # 服务入口（端口被占用时自动切换）
    ├── help.js
    ├── data                         # 抽奖用户 / 结果数据
    └── cache
```

> 1. product 为前端页面目录（Vue 3 + Vite）
> 2. public 目录下的静态资源构建时会原样拷贝到产物中
> 3. vite.config.js 为构建 / 开发服务配置文件
> 4. server 为后端数据服务目录，其中 config.js 为奖品信息的配置文件

## 配置信息

### 抽奖用户信息配置

抽奖用户信息在**`server/data/user.xlsx`**文件中，按文件格式进行填充，不能修改文件名和列头

### 奖品信息配置

奖品的配置信息填写在**server/config.js**文件中，不能修改文件名。

**其中奖品 prizes 的配置描述如下：**

| 参数  | 值类型 | 描述                                                         |
| ----- | ------ | ------------------------------------------------------------ |
| type  | Number | 奖品类型，唯一标识，0 是默认特别奖的占位符，其它奖品不可使用 |
| count | Number | 奖品数量                                                     |
| text  | String | 奖项名称                                                     |
| title | String | 奖品描述                                                     |
| img   | String | 奖品的图片地址，图片在**img**目录下                          |

```js
// 奖品信息，第一项为预留项不可修改，其他项可根据需要修改
let prizes = [{
        type: 0,
        count: 1000,
        title: "",
        text: "特别奖"
    },
    {
        type: 1,
        count: 2,
        text: "特等奖",
        title: "神秘大礼",
        img: "../img/secrit.jpg"
    },
    {
        type: 2,
        count: 5,
        text: "一等奖",
        title: "Mac Pro",
        img: "../img/mbp.jpg"
    }
    ...
];
```

### 奖品每次抽取个数配置

**EACH_COUNT**用于配置每次的抽奖个数，与 prizes 奖品一一对应，例如上面的奖品配置对应的抽奖个数配置如下：

```js
const EACH_COUNT = [1, 1, 5];
```

如上配置，表示一次抽取的奖品个数顺序为：特别奖每次抽一个，特等奖每次抽一个，一等奖每次抽五个

### 企业标识配置

该标识用于显示在抽奖卡片上。

```js
const COMPANY = "MoShang";
```


## Docker部署方案

### 概述

该项目现在支持使用Docker进行部署。Docker是一个轻量级的容器化平台，可以让您快速地部署、测试和运行应用程序。本文档将向您介绍如何使用Docker部署该项目。

### 系统要求

在您开始使用Docker部署该项目之前，您需要确保已经安装了以下软件：

- Docker（请参阅Docker的官方文档以获取安装说明）
- Docker Compose

### 安装

1. 下载并解压该项目的源代码。

2. 进入解压后的项目目录。

3. 执行以下命令以构建Docker镜像：

   ```
   ./build.sh [TAG]
   ```

   这将使用Dockerfile构建一个名为`lottery:[TAG]`的Docker镜像。如果未指定标签，则默认使用`latest`标签。

4. 执行以下命令以在本地运行容器：

   ```
   ./dev.sh [TAG]
   ```

   这将启动容器并将应用程序部署在Docker容器中。您可以在本地进行测试，确保一切正常。请注意，容器内部的应用程序将会监听8888端口和443端口。

5. 执行以下命令以将Docker镜像标记并推送到远程Docker仓库：

   ```
   ./tagpush.sh [TAG]
   ```

   这将为Docker镜像打上标签并将其推送到远程Docker仓库，如果要使用docker官方的hub请先在https://hub.docker.com/新建自己的repo，然后将文件中的用户名改为自己。请注意，`[TAG]`应替换为您要使用的标签名称。

6. 确保有一个名为`docker-compose.yml`的文件，并添加以下内容：

   ```
   version: '3.8'
   
   volumes:
     lottery_log:
   
   services:
     lottery:
       container_name: lottery
       expose:
         - 8888
       ports:
         - "28458:8888"
         - "443:443"
       volumes:
         - "lottery_log:/var/log"
       image: "panda1024/lottery:[TAG]" 
       restart: always
   ```

   请注意，`[TAG]`应替换为您推送到Docker仓库的镜像名称。

7. 在服务器上的项目目录中运行以下命令以使用Docker Compose部署应用程序：

```
	docker-compose up -d
```

​		这将启动一个Docker Compose堆栈，并将该项目部署在其中。请注意，此处将容器的8888端口和443端口映射		到了服务器上的8888端口和443端口。如果您希望使用其他端口，请相应地更改`docker-compose.yml`文件。



## License

MIT
