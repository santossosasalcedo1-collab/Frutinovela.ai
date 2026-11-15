FRUTINOVELAS IA - SERVIDOR OPENAI

Este servidor genera guiones y planes de escenas para el archivo HTML.
El navegador dibuja la animación y utiliza las voces disponibles en el dispositivo.
No genera por sí solo un archivo de video cinematográfico con modelos de video.

PUBLICAR EN RENDER
1. Descomprime este ZIP.
2. Sube server.js y package.json a un repositorio de GitHub.
3. En Render elige New + > Web Service y conecta ese repositorio.
4. Build Command: npm install
5. Start Command: npm start
6. En Environment agrega OPENAI_API_KEY con tu clave secreta de API.
7. Publica y espera que el servicio indique Live.
8. Copia la URL de Render y añade /generar.
   Ejemplo: https://mi-servidor.onrender.com/generar
9. Pega esa URL en el campo superior del archivo HTML.

SEGURIDAD
- No escribas la clave API en el HTML.
- No compartas la clave por chat ni la subas a GitHub.
- La API puede generar cargos. Pide a un adulto que gestione la cuenta y el uso.
- OPENAI_MODEL es opcional; por defecto se usa gpt-4.1.

PRUEBA
Al abrir https://TU-SERVICIO.onrender.com/salud debe aparecer {"ok":true}.
