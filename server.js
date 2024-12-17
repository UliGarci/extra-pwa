const express = require('express'); 
const cors = require('cors');
const compression = require('compression');
const fs = require('fs');
const PouchDB = require('pouchdb');
const bodyParser = require('body-parser');


const app = express();
const db = new PouchDB('tienda');

app.use(cors());
app.use(compression());
app.use(bodyParser.json());
app.use(express.static('public'));

function loadInitialData() {
  const jsonData = JSON.parse(fs.readFileSync('./db.json', 'utf-8'));
  if (jsonData.tienda) {
    jsonData.tienda.forEach(async (item) => {
      try {
        await db.put({ _id: item.id.toString(), ...item });
      } catch (error) {
        if (error.status !== 409) { 
          console.error(`Error:`, error.message);
        }
      }
    });
  }
}

app.get('/', async (req, res) => {
  try {
    const result = await db.allDocs({ include_docs: true });
    res.status(200).json(result.rows.map(row => row.doc));
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

app.post('/registrar', async (req, res) => {
  const { id, nombre, descripcion, precio, cantidad } = req.body;

  if (!id || !nombre || !descripcion || !precio || !cantidad) {
    return res.status(400).json({ error: true, message: 'Faltan datos del producto.' });
  }

  try {
    const item = await db.put({
      _id: id.toString(),
      id,
      nombre,
      descripcion,
      precio,
      cantidad,
    });
    res.status(201).json({ error: false, item });
  } catch (error) {
    if (error.status === 409) {
      res.status(409).json({ error: true, message: 'Producto ya existente' });
    } else {
      res.status(500).json({ error: true, message: error.message });
    }
  }
});

app.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, cantidad } = req.body;

  try {
    const item = await db.get(id.toString());
    const updatedItem = {
      ...item,
      nombre,
      descripcion,
      precio,
      cantidad,
    };
    await db.put(updatedItem);
    res.status(200).json({ error: false});
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const item = await db.get(id.toString());
    await db.remove(item);
    res.status(200).json({ error: false });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  loadInitialData();
});