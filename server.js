//mongodb+srv://rolriverag:ZsWcXYg5ubzkdUb9@proyecto.zxrqy.mongodb.net/?retryWrites=true&w=majority&appName=Proyecto
const cors = require('cors');
const {MongoClient, ServerApiVersion, ObjectId} = require("mongodb");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const port = 3002;
const uri = "mongodb+srv://rolriverag:ZsWcXYg5ubzkdUb9@proyecto.zxrqy.mongodb.net/?retryWrites=true&w=majority&appName=Proyecto";
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000'  
}));

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

app.post("/login", async (req, res) => {
    try {
        const { user, contra } = req.body;

        if (!user || !contra) {
            return res.status(400).json({ message: "Faltan parámetros requeridos" });
        }

        const database = client.db("sistema");
        const usuarios = database.collection("usuarios");

        // Buscar el usuario en la base de datos
        const usuario = await usuarios.findOne({ user: user });

        if (!usuario) {
            return res.status(400).json({ message: "Usuario no encontrado" });
        }

        // Verificar la contraseña
        if (usuario.contra !== contra) {
            return res.status(400).json({ message: "Contraseña incorrecta" });
        }

        // Validar según el tipo de usuario
        switch (usuario.tipo) {
            case 'Administrador':
                // Si es administrador, solo valida el usuario y la contraseña
                return res.status(200).json({ message: "Inicio de sesión exitoso como administrador", usuario });
            
            case 'Maestro':
                // Si es maestro, además de la contraseña y usuario, verifica el permiso
                if (usuario.permiso !== 'S') {
                    return res.status(400).json({ message: "Permiso denegado. El permiso debe estar en 'S'" });
                }
                return res.status(200).json({ message: "Inicio de sesión exitoso como maestro", usuario });

            case 'Alumno':
                // Si es estudiante, solo valida el usuario y la contraseña
                return res.status(200).json({ message: "Inicio de sesión exitoso como alumno", usuario });

            default:
                return res.status(400).json({ message: "Tipo de usuario no válido" });
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Algo salió mal, intenta de nuevo" });
    }
});


app.get("/listarExamenes", async (req, res) => {
    try {
        const database = client.db("sistema");
        const examenes = database.collection("Examen");
        const query = {};
        const options = {
            sort: {},
        };
        const resultados = examenes.find(query, options);
        if ((await examenes.countDocuments(query)) === 0) {
            return res.status(500).send("No se encontraron examenes");
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

app.put("/cambiarPermiso", async (req, res) => {
    try {
        const { userId } = req.body; 

        if (!userId) {
            return res.status(400).send("Falta el ID del usuario");
        }

        const database = client.db("sistema");
        const usuarios = database.collection("usuarios");

        const resultado = await usuarios.updateOne(
            { _id: new ObjectId(userId) }, // Asegúrate de que el ID sea del tipo ObjectId
            { $set: { permiso: "S" } }
        );

        if (resultado.matchedCount === 0) {
            return res.status(404).send("Usuario no encontrado");
        }

        if (resultado.modifiedCount === 0) {
            return res.status(500).send("No se pudo actualizar el permiso");
        }

        return res.status(200).send("Permiso actualizado exitosamente");
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