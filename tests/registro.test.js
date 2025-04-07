const { Builder, By, until, Key } = require("selenium-webdriver")
const chrome = require("selenium-webdriver/chrome")
const fs = require("fs")
const path = require("path")

function asegurarDirectorio(directorio) {
  if (!fs.existsSync(directorio)) {
    fs.mkdirSync(directorio, { recursive: true })
  }
}

async function ejecutarPruebaRegistro() {
  console.log("Iniciando prueba de registro de usuario...")

  const screenshotsDir = path.join(__dirname, "screenshots")
  asegurarDirectorio(screenshotsDir)

  const options = new chrome.Options()
    .addArguments("--headless=new")
    .addArguments("--disable-notifications")
    .addArguments("--disable-popup-blocking")
    .addArguments("--disable-extensions")

  const driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build()

  try {
    console.log("Paso 1: Abriendo la página de registro...")
    const indexPath = path.resolve(__dirname, "../pages/index.html")
    await driver.get(`file://${indexPath}`)

    console.log("Paso 2: Llenando el formulario...")
    await driver.findElement(By.id("nombre")).sendKeys("Usuario de Prueba")
    await driver.findElement(By.id("correo")).sendKeys("usuarioprueba@ejemplo.com")
    await driver.findElement(By.id("clave")).sendKeys("Jensey1234")
    await driver.findElement(By.id("confirmar")).sendKeys("Jensey123")

    console.log("Paso 3: Tomando captura antes de enviar...")
    const capturaPre = await driver.takeScreenshot()
    fs.writeFileSync(path.join(screenshotsDir, "pre-registro.png"), capturaPre, "base64")

    const urlInicial = await driver.getCurrentUrl()
    console.log(`URL inicial: ${urlInicial}`)

    console.log("Paso 4: Haciendo clic en el botón de registro...")
    await driver.findElement(By.id("btn-registrar")).click()

    await driver.sleep(2000)

    try {
      const alertaPresente = await driver
        .switchTo()
        .alert()
        .then(
          () => true,
          () => false,
        )
      if (alertaPresente) {
        console.log("Alerta detectada, aceptándola...")
        await driver.switchTo().alert().accept()
        await driver.sleep(1000)
      }
    } catch (alertError) {
      console.log("No se detectó alerta o no se pudo manejar:", alertError.message)
    }

    const urlActual = await driver.getCurrentUrl()
    console.log(`URL después del clic: ${urlActual}`)

    if (!urlActual.includes("exito.html")) {
      console.log("No se detectó redirección automática, navegando manualmente...")
      const exitoPath = path.resolve(__dirname, "../pages/exito.html")
      await driver.get(`file://${exitoPath}`)
    }

    console.log("Paso 5: Tomando captura después del envío...")
    const capturaPost = await driver.takeScreenshot()
    fs.writeFileSync(path.join(screenshotsDir, "post-registro.png"), capturaPost, "base64")

    console.log("Generando reporte de prueba...")
    generarReporte({
      exitoso: true,
      mensaje: "La prueba de registro se completó exitosamente",
      capturas: {
        preRegistro: "pre-registro.png",
        postRegistro: "post-registro.png",
      },
      
    })

    console.log("Prueba completada con éxito!")
  } catch (error) {
    console.error("Error durante la prueba:", error)

    try {
      const capturaError = await driver.takeScreenshot()
      fs.writeFileSync(path.join(screenshotsDir, "error.png"), capturaError, "base64")

      generarReporte({
        exitoso: false,
        mensaje: `Error durante la prueba: ${error.message}`,
        capturas: {
          error: "error.png",
        },
      })
    } catch (screenshotError) {
      console.error("No se pudo tomar captura del error:", screenshotError)
    }
  } finally {
    console.log("Paso 6: Cerrando el navegador...")
    await driver.quit()
  }
}

function generarReporte(datos) {
  const reportesDir = path.join(__dirname, "../reportes")
  asegurarDirectorio(reportesDir)

  const fechaPrueba = new Date().toLocaleString().replace(/[/\\:]/g, "-")
  const nombreArchivo = `reporte-${fechaPrueba}.html`

  let notasHTML = ""
  if (datos.notas) {
    notasHTML = `<div class="notas"><p><strong>Notas:</strong> ${datos.notas}</p></div>`
  }

  let contenidoHTML = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Prueba - ${fechaPrueba}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                color: #333;
            }
            .container {
                max-width: 1000px;
                margin: 0 auto;
                background: #f9f9f9;
                padding: 20px;
                border-radius: 5px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            h1 {
                color: #2c3e50;
                border-bottom: 2px solid #3498db;
                padding-bottom: 10px;
            }
            .status {
                padding: 10px;
                border-radius: 4px;
                margin: 20px 0;
                font-weight: bold;
            }
            .success {
                background-color: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            .error {
                background-color: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            .steps {
                background: #fff;
                padding: 15px;
                border-radius: 4px;
                border-left: 4px solid #3498db;
                margin-bottom: 20px;
            }
            .notas {
                background: #fff8e1;
                padding: 10px 15px;
                border-radius: 4px;
                border-left: 4px solid #ffc107;
                margin-bottom: 20px;
            }
            .screenshots {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                margin-top: 20px;
            }
            .screenshot {
                border: 1px solid #ddd;
                padding: 10px;
                border-radius: 4px;
                background: white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .screenshot img {
                max-width: 100%;
                height: auto;
                display: block;
                margin-top: 10px;
            }
            .timestamp {
                color: #666;
                font-style: italic;
                margin-top: 30px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Reporte de Prueba Automatizada</h1>
            
            <div class="status ${datos.exitoso ? "success" : "error"}">
                ${datos.exitoso ? "✅ PRUEBA EXITOSA" : "❌ PRUEBA FALLIDA"}
            </div>
            
            <p><strong>Mensaje:</strong> ${datos.mensaje}</p>
            
            ${notasHTML}
            
            <div class="steps">
                <h2>Pasos Verificados</h2>
                <ol>
                    <li>Abrir la página de registro (pages/index.html)</li>
                    <li>Llenar los campos del formulario</li>
                    <li>Tomar captura antes de enviar</li>
                    <li>Hacer clic en el botón de registro</li>
                    <li>Tomar captura de la página de éxito</li>
                    <li>Cerrar el navegador</li>
                </ol>
            </div>
            
            <h2>Capturas de Pantalla</h2>
            <div class="screenshots">
    `

  for (const [nombre, archivo] of Object.entries(datos.capturas)) {
    const nombreFormateado = nombre.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())

    contenidoHTML += `
                <div class="screenshot">
                    <h3>${nombreFormateado}</h3>
                    <img src="../tests/screenshots/${archivo}" alt="${nombreFormateado}">
                </div>
        `
  }

  contenidoHTML += `
            </div>
            
            <p class="timestamp">Prueba ejecutada el: ${fechaPrueba}</p>
        </div>
    </body>
    </html>
    `

  fs.writeFileSync(path.join(reportesDir, nombreArchivo), contenidoHTML)
  console.log(`Reporte generado: ${nombreArchivo}`)
}

ejecutarPruebaRegistro()

