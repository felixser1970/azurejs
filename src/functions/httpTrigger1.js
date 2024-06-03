const { app } = require('@azure/functions');
const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
const sql = require('mssql');

// Enter your storage account name and shared key
const account = "almacen001";
const accountKey = "r8pSg9PDgZCPXMcS+2VJK70+ecSmXKgR7YC+9QRFdSZj1LYVA0xBpcw36q1Hjlt46Qx+R0GJfmrG+ASt0OZyUQ==";

// Use StorageSharedKeyCredential with storage account and account key
// StorageSharedKeyCredential is only available in Node.js runtime, not in browsers
const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
const blobServiceClient = new BlobServiceClient(
  `https://${account}.blob.core.windows.net`,
  sharedKeyCredential
);


 // PARA CONECTARSE A LA BASE DE DATOS
async function connectToDatabase() {
    try {
      await sql.connect('Server=sqltef.database.windows.net,1433;Database=general;User Id=felix;Password=Astorga2024;Encrypt=true');
      const result = await sql.query`SELECT * FROM MiTabla WHERE id >= 1`;
      // console.dir(result.recordset);
      return result.recordset;
    } catch (err) {
      console.log('ERROR:', err.message);
      return null;
    }
  }

async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
            readableStream.on("data", (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
            readableStream.on("end", () => {
            resolve(Buffer.concat(chunks));
        });
           readableStream.on("error", reject);
    });
}

async function listar_contenedores() {
    let i = 1;
    let iter = blobServiceClient.listContainers();
    let containerItem = await iter.next();
    while (!containerItem.done) {
        console.log(`Container ${i++}: ${containerItem.value.name}`);
        containerItem = await iter.next();
        }
}
 // ...

app.http('httpTrigger1', {
    methods: ['GET', 'POST'],
    authLevel:  'function',   //'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url} con parametros ${request.query} CABECERAS ${ request.headers}"`);
       
        await listar_contenedores()
        const containerClient = blobServiceClient.getContainerClient('$web');
        const blobClient = containerClient.getBlobClient('prueba.txt');
        const downloadBlockBlobResponse = await blobClient.download();
        const downloaded = (
            await streamToBuffer(downloadBlockBlobResponse.readableStreamBody)
          ).toString();

        console.log("Downloaded blob content:", downloaded);

        const functionKey = request.headers.get('x-functions-key');
        const name = request.query.get('name') || await request.text() || 'No Name';

        if (functionKey) {  // key del API -> kF8O3OkPvJ9Inw4JvsA8+DmcttQvLnPBpyjNBgMdIJ2LWYwUGKeHVg==

            if (functionKey === 'yjFXycwSS4NlwtoOZpKrmHWN0LHbEBFvULwdzAEE8-tZAzFuRQN6EA==') {

                const salida =  await (async () => {
                    var nombres = ''
                    queryResult = await connectToDatabase();
                    if (queryResult) {
                    console.dir(queryResult);
                    for (let i = 0; i < queryResult.length; i++) {
                        nombres =  `${nombres} ${queryResult[i].nombre} `;
                    }
                    return `${nombres} ${downloaded}`;
                    
                    } 
                    else {     
                    console.log('No se pudo obtener el resultado de la consulta.');
                    return 'error';
                    
                    }
                })();

                return { body: `Hola,${name} Todos los nombres =  ${salida}` };
            } else {
                return { status: 401, body: 'Clave de función no válida.' };
            } 

        } else {
            return { status: 400, body: 'No se proporcionó la clave de función.' };
        }
    

    }
});

// CON LA API KEY

/*

 // Obtén la clave de función desde el encabezado de la solicitud
        const functionKey = request.headers['x-functions-key'];

        if (functionKey) {
            // Verifica si la clave de función es válida (puedes implementar tu propia lógica aquí)
            // Si es válida, continúa con el procesamiento
            // Si no es válida, devuelve un error o una respuesta no autorizada
            // Por ejemplo:
            if (functionKey === 'tu_clave_secreta') {
                const name = request.query.get('name') || await request.text() || 'No Name';
                // Resto de la lógica de la función...
                return { body: `Hola, ${name}!` };
            } else {
                return { status: 401, body: 'Clave de función no válida.' };
            }
        } else {
            return { status: 400, body: 'No se proporcionó la clave de función.' };
        }
    }
});



*/

