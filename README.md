# 我的测试站点

> ⚠️ **前提**：本说明以「GitHub 登录名 = `lengzhiluo`」为目标。
> 若你还没把账号用户名改成 `lengzhiluo`，请先到 GitHub **Settings → Account** 把 Username 改成 `lengzhiluo`
> （需该名未被占用），否则用户页地址不会是 `lengzhiluo.github.io`。
> 若不改名（登录名仍是 `pengyuyan88`），则用户页地址为 `https://pengyuyan88.github.io/`，
> 或项目页 `https://pengyuyan88.github.io/仓库名/`。

用 GitHub Pages 免费托管的小网站，用于测试自己写的项目。

## 本地预览

直接用浏览器打开 `index.html` 即可，无需任何构建步骤。

## 部署到 GitHub Pages

### 方式一：项目页（推荐，仓库名随意）

1. 在 GitHub 新建一个仓库，例如 `my-test-site`（名字随便取）。
2. 把本目录所有文件推送到该仓库的 `main` 分支：

   ```bash
   git remote add origin https://github.com/lengzhiluo/my-test-site.git
   git branch -M main
   git push -u origin main
   ```

3. 进入仓库 **Settings → Pages**，Source 选择 **Deploy from a branch**，
   Branch 选 `main`、目录选 `/ (root)`，点击 Save。
4. 等待 1～2 分钟，访问 `https://lengzhiluo.github.io/my-test-site/` 即可。

### 方式二：用户页（专属主域名）

1. 仓库名**必须**是 `lengzhiluo.github.io`。
2. 同样推送到 `main` 分支并在 Settings → Pages 开启。
3. 访问 `https://lengzhiluo.github.io/` 即可（无需仓库名后缀）。

> 注意：把上面所有 `lengzhiluo` 替换成你真实的 GitHub 用户名。
> 改完内容后，`git add . && git commit -m "更新" && git push` 就会自动重新发布。

## 文件说明

- `index.html` —— 页面结构
- `style.css` —— 样式
- `script.js` —— 示例交互（点击计数）
