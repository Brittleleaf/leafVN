# 🍃 Leaf VN Studio

Motor y editor independiente de Novelas Visuales e historias interactivas.

## 🚀 Despliegue en Vercel

Leaf VN es una aplicación autónoma construida con **Next.js (App Router)** y **Tailwind CSS**. Está optimizada para desplegarse directamente en Vercel con un solo clic o mediante Vercel CLI.

### Opción 1: Despliegue desde GitHub (Recomendado)
1. Inicializa el repositorio git en esta carpeta:
   ```bash
   git init
   git add .
   git commit -m "feat: Leaf VN standalone studio"
   git branch -M main
   ```
2. Crea un repositorio en GitHub (ejemplo: `leaf-vn`) y vincula tu remoto:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/leaf-vn.git
   git push -u origin main
   ```
3. Entra a [Vercel](https://vercel.com/dashboard) y haz clic en **"Add New Project"**.
4. Importa tu repositorio `leaf-vn`. Vercel detectará automáticamente Next.js.
5. Haz clic en **"Deploy"**. En 1 minuto tendrás tu URL lista (ej. `https://leaf-vn.vercel.app`).

### Opción 2: Despliegue directo mediante Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## 🔗 Conexión con Justin Site

En tu sitio web (`justin-site`), la novela visual se ejecuta en `/lore` usando exclusivamente el reproductor (`VNPlayer`), sin cargar el editor en la web principal.

Para conectar el botón de acceso al editor desde la web:
1. En el archivo `.env.local` de `justin-site`, añade:
   ```env
   NEXT_PUBLIC_LEAF_VN_URL=https://leaf-vn.vercel.app
   ```
2. Cuando hagas clic en **"OPEN LEAF VN STUDIO ↗"** en la web, abrirá directamente este estudio.
3. Para jugar tus historias creadas en la web:
   - Exporta el archivo `.json` o `.leafvn` desde este Launcher usando el botón **Exportar**.
   - Cárgalo en `justin-site/public/data/stories/lore-story.json` o mediante la opción de cargar en el reproductor.

---

## 🛠️ Desarrollo Local
```bash
npm install
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.
