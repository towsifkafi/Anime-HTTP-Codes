import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import nunjucks from 'nunjucks'

nunjucks.configure('src/templates', { autoescape: true })

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  plugins: [
    {
      name: 'serve-nunjucks',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const cssContent = fs.readFileSync('src/styles/style.css', 'utf8')
          const data = JSON.parse(fs.readFileSync('status_codes.json', 'utf8'))
          const codesList = data.status_codes.sort((a, b) => Number(a.code) - Number(b.code))

          if (req.url === '/' || req.url === '/index.html') {
            const html = nunjucks.render('index-page.njk', { codes: codesList, cssContent })
            res.setHeader('Content-Type', 'text/html')
            res.end(html)
            return
          }

          const match = req.url.match(/^\/(\d{3})\.html$/)
          if (match) {
            const item = codesList.find(c => c.code === match[1])
            if (item) {
              const html = nunjucks.render('error-page.njk', { ...item, cssContent })
              res.setHeader('Content-Type', 'text/html')
              res.end(html)
              return
            }
          }
          next()
        })
      }
    },
    {
      name: 'generate-error-pages',
      apply: 'build',
      closeBundle() {
        const distDir = 'dist'
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true })
        }

        const cssContent = fs.readFileSync('src/styles/style.css', 'utf8')

        const data = JSON.parse(fs.readFileSync('status_codes.json', 'utf8'))
        const codes = data.status_codes

        const codesList = codes
          .sort((a, b) => Number(a.code) - Number(b.code))

        codesList.forEach(({ code, name, image }) => {
          const html = nunjucks.render('error-page.njk', {
            code,
            name,
            image,
            cssContent
          })
          fs.writeFileSync(path.join(distDir, `${code}.html`), html)
          console.log(`✓ Generated ${code}.html`)
        })

        const indexHtml = nunjucks.render('index-page.njk', { codes: codesList, cssContent })
        fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml)
        console.log('✓ Generated index.html')

        console.log('\n✓ Build complete! All files in `dist` folder.')
      }
    }
  ]
})
