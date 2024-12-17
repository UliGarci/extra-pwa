document.addEventListener("DOMContentLoaded", () => {
  const db = new PouchDB("tienda");
  const lista = document.getElementById("lista");
  const form = document.getElementById("form");
  const submitButton = document.getElementById("submitButton");
  const cancelButton = document.getElementById("cancelButton");

  let is_edit = false;
  let itemId = null;

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2,5);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
  
    const id = is_edit ? itemId : newId();
    const nombre = document.getElementById("nombreText").value;
    const descripcion = document.getElementById("descripcionText").value;
    const precio = document.getElementById("precioText").value;
    const cantidad = document.getElementById("cantidadText").value;
  
    if (!nombre || !descripcion || !precio || !cantidad) {
      alert("Todos los campos son obligatorios.");
      return;
    }
  
    try {
      const item = {
        _id: id,
        id,
        nombre,
        descripcion,
        precio,
        cantidad,
      };
  
      if (is_edit) {
        const existingProduct = await db.get(id);
        item._rev = existingProduct._rev;
        await db.put(item);
        is_edit = false;
        itemId = null;
        submitButton.textContent = "Registrar Producto";
        cancelButton.style.display = "none";
        if (navigator.onLine) {
          Swal.fire({
            title: "Actualizado!",
            icon: "success",
          });
        } else {
          Swal.fire({
            title: "Actualizado",
            icon: "info",
            text: "Se guardó de forma local",
          });
        }
        
      } else {
        await db.put(item);
        if(navigator.onLine){
          Swal.fire({
            title:"Registrado",
            icon: "success"
          })
        }else{
          Swal.fire({
            title: "Registrado",
            icon: "info",
            text: "Se guardó de forma local"
            })
            
        }
        
      }
      actualizarLista();
      form.reset();
    } catch (error) {
      console.error("Error registrando producto:", error);
      alert("Error registrando producto. Verifica la consola.");
    }
  });
  
  async function actualizarLista() {
    try {
      const response = await db.allDocs({ include_docs: true });
      lista.innerHTML = "";

      response.rows.forEach((row) => {
        const i = document.createElement("i");
        i.className = "list-group-item d-flex justify-content-between align-items-center";
        i.innerHTML = `
          Nombre: ${row.doc.nombre} <br/> Descripcion: ${row.doc.descripcion} <br/>Precio: ${row.doc.precio} <br/> Cantidad: ${row.doc.cantidad}
          <div class="btn-group space-between">
            <button class="btn btn-sm btn-warning edit-btn" data-id="${row.doc._id}">Editar</button>
            <button class="btn btn-sm btn-danger delete-btn" data-id="${row.doc._id}">Eliminar</button>
          </div>
        `;
        lista.appendChild(i);
      });

      document.querySelectorAll(".edit-btn").forEach((button) => {
        button.addEventListener("click", async (event) => {
          const id = event.target.getAttribute("data-id");
          const product = await db.get(id);
          document.getElementById("nombreText").value = product.nombre;
          document.getElementById("descripcionText").value = product.descripcion;
          document.getElementById("precioText").value = product.precio;
          document.getElementById("cantidadText").value = product.cantidad;

          is_edit = true;
          itemId = id;
          submitButton.textContent = "Guardar cambios";
          cancelButton.style.display = "inline-block";
        });
      });

      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", async (event) => {
          const id = event.target.getAttribute("data-id");
          try {
            const product = await db.get(id);
            Swal.fire({
              title: "¿Estás seguro?",
              text: `Se eliminará el producto "${product.nombre}". Esta acción no se puede deshacer.`,
              icon: "warning",
              showCancelButton: true,
              confirmButtonText: "Sí, eliminar",
              cancelButtonText: "Cancelar",
              confirmButtonColor: "#d33",
              cancelButtonColor: "#3085d6",
            }).then(async (result) => {
              if (result.isConfirmed) {
                await db.remove(product);
                Swal.fire(
                  "Eliminado",
                  `El producto "${product.nombre}" fue eliminado correctamente.`,
                  "success"
                );
                actualizarLista();
              }
            });
          } catch (error) {
            console.error("Error eliminando producto:", error);
            alert("Error eliminando producto. Verifica la consola.");
          }
        });
      });
    } catch (error) {
      console.error("Error actualizando lista de productos:", error);
    }
  }


  cancelButton.addEventListener("click", () => {
    is_edit = false;
    itemId = null;
    submitButton.textContent = "Registrar Producto";
    cancelButton.style.display = "none";
    form.reset();
  });

  actualizarLista();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("Service Worker registrado con éxito:", registration);
        })
        .catch((error) => {
          console.log("Error al registrar el Service Worker:", error);
        });
    });
  }

  window.addEventListener("online", () => {
    Swal.fire({
      title: "Conexión restaurada",
      text: "has recuperado la conexión a internet",
      icon: "info"
    });
  });

  window.addEventListener("offline", () => {
    Swal.fire({
      title: "Sin internet?",
      text: "El modo offline esta activado, los recursos seran guardado en cache",
      icon: "question"
    });
  });
});