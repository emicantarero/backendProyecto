//mongodb+srv://rolriverag:ZsWcXYg5ubzkdUb9@proyecto.zxrqy.mongodb.net/?retryWrites=true&w=majority&appName=Proyecto
const {MongoClient, ServerApiVersion, ObjectId} = require("mongodb");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const port = 3002;
const uri = "mongodb+srv://rolriverag:ZsWcXYg5ubzkdUb9@proyecto.zxrqy.mongodb.net/?retryWrites=true&w=majority&appName=Proyecto";
app.use(express.json());

//app.use(express.urlencoded({extended: true}));
var urlEncodeParser = bodyParser.urlencoded({extended: true});
app.use(urlEncodeParser);

//Levantar el servidor
app.listen(port, () => {
    //console.log('Hola');
});

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectToDatabase() {
    try {
        await client.connect();
        await client.db("admin").command({ping: 1});
    } catch (error) {
        process.exit(1);
    }
}
connectToDatabase();

app.get("/listarUsers", async (req, res) => {
    try {
        const database = client.db("sistema");
        const usuarios = database.collection("usuarios");
        const query = {};
        const options = {
            sort: {},
        };
        const resultados = usuarios.find(query, options);
        if ((await usuarios.countDocuments(query)) === 0) {
            return res.status(500).send("No se encontraron usuarios");
        } else {
            let arr = [];
            for await (const doc of resultados) {
                arr.push(doc);
            }
            return res.status(200).send({arr});
        }
    } catch (error) {
        return res.status(500).send("Algo salió mal, intentalo de nuevo");
    }
});

app.post("/crearUser", async (req, res) => {
    try {
        const {correo, user, tipo, contra} = req.body;
        if (!correo || !user || !tipo || !contra){
            return res.status(400).send("Faltan parametros requeridos");
        }
        const database = client.db("sistema");
        const usuarios = database.collection("usuarios");
        const doc = {
            correo: correo,
            user: user,
            contra: contra,
            tipo: tipo,
            permiso: "N" 
        }
        const resultado = await usuarios.insertOne(doc);
        res.status(200).send("Usuario registrado exitosamente");
    } catch (error) {
        console.log(error);
        return res.status(500).send("Algo salió mal, intentalo de nuevo");
    }
});


process.on("SIGINT", async () => {
    try {
        console.log("Deteniendo la aplicación...");
        // Cerrar el cliente de MongoDB
        await client.close();
        console.log("Cliente de MongoDB cerrado correctamente");
        process.exit(0);
    } catch (error) {
        console.error("Error al cerrar el cliente de MongoDB", error);
        process.exit(1);
    }
});