import React, { useState, useEffect } from 'react';
import {
  SafeAreaView, View, Text, TextInput, FlatList, ScrollView, Pressable, StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, CATEGORIAS, PRODUCTOS_INICIALES } from './data';

const CLAVE = '@zongory_app';
const FORM_VACIO = { nombre: '', categoria: 'Comida', precio: '', stock: '', descripcion: '' };

function cop(n) {
  const num = Math.max(0, Math.round(Number(n) || 0));
  return '$' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function promResenas(r = []) {
  if (!r.length) return 'Sin reseñas';
  const suma = r.reduce((acc, x) => acc + x, 0);
  return (suma / r.length).toFixed(1) + '/5 (' + r.length + ')';
}

export default function App() {
  const [productos, setProductos] = useState(PRODUCTOS_INICIALES);
  const [vista, setVista] = useState('inicio');
  const [idDetalle, setIdDetalle] = useState(null);
  const [favoritos, setFavoritos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [aviso, setAviso] = useState('');
  const [listo, setListo] = useState(false);

  const [busqueda, setBusqueda] = useState('');
  const [catSel, setCatSel] = useState('Todas');
  const [orden, setOrden] = useState('none');

  const [cupon, setCupon] = useState('');
  const [descActiva, setDescActiva] = useState(false);
  const [cli, setCli] = useState({ nombre: '', telefono: '', municipio: '', direccion: '' });
  const [ultimoPedido, setUltimoPedido] = useState(null);

  const [estrellas, setEstrellas] = useState('');
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);

  useEffect(() => {
    async function cargar() {
      try {
        const raw = await AsyncStorage.getItem(CLAVE);
        if (raw) {
          const d = JSON.parse(raw);
          if (d.catalogoVersion === 2 && Array.isArray(d.productos) && d.productos.length) setProductos(d.productos);
          if (Array.isArray(d.favoritos)) setFavoritos(d.favoritos);
          if (Array.isArray(d.carrito)) setCarrito(d.carrito);
          if (Array.isArray(d.historial)) setHistorial(d.historial);
        }
      } catch (_e) {
        setAviso('No se pudieron cargar datos guardados; se usa el inicio.');
      } finally {
        setListo(true);
      }
    }
    cargar();
  }, []);

  useEffect(() => {
    if (!listo) return;
    AsyncStorage.setItem(
      CLAVE,
      JSON.stringify({ catalogoVersion: 2, productos, favoritos, carrito, historial }),
    ).catch(() => {});
  }, [productos, favoritos, carrito, historial, listo]);

  const filtrados = [...productos]
    .filter((p) => {
      const okNom = p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase());
      const okCat = catSel === 'Todas' || p.categoria === catSel;
      return okNom && okCat;
    })
    .sort((a, b) => {
      if (orden === 'asc') return a.precio - b.precio;
      if (orden === 'desc') return b.precio - a.precio;
      return 0;
    });

  function toggleFav(id) {
    if (favoritos.includes(id)) {
      setFavoritos(favoritos.filter((x) => x !== id));
      setAviso('Quitado de favoritos.');
    } else {
      setFavoritos([...favoritos, id]);
      setAviso('Agregado a favoritos.');
    }
  }

  function agregarCarrito(prod) {
    if (prod.stock <= 0) {
      setAviso('Producto agotado.');
      return;
    }
    const item = carrito.find((c) => c.productoId === prod.id);
    const cant = item ? item.cantidad : 0;
    if (cant >= prod.stock) {
      setAviso('Stock máximo alcanzado (' + prod.stock + ').');
      return;
    }
    if (item) {
      setCarrito(carrito.map((c) => (c.productoId === prod.id ? { ...c, cantidad: c.cantidad + 1 } : c)));
    } else {
      setCarrito([...carrito, { productoId: prod.id, cantidad: 1 }]);
    }
    setAviso('Agregado: ' + prod.nombre);
  }

  function cambiarCant(id, delta) {
    const prod = productos.find((p) => p.id === id);
    const item = carrito.find((c) => c.productoId === id);
    if (!prod || !item) return;
    const next = item.cantidad + delta;
    if (next < 1) {
      setAviso('Mínimo 1 unidad. Usa Eliminar para quitarlo.');
      return;
    }
    if (next > prod.stock) {
      setAviso('Solo hay ' + prod.stock + ' disponibles.');
      return;
    }
    setCarrito(carrito.map((c) => (c.productoId === id ? { ...c, cantidad: next } : c)));
  }

  function quitarItem(id) {
    setCarrito(carrito.filter((c) => c.productoId !== id));
    setAviso('Producto eliminado del carrito.');
  }

  const lineas = carrito
    .map((c) => {
      const p = productos.find((x) => x.id === c.productoId);
      if (!p) return null;
      return { p, cantidad: c.cantidad, totalLinea: p.precio * c.cantidad };
    })
    .filter(Boolean);

  const subtotal = lineas.reduce((acc, x) => acc + x.totalLinea, 0);
  const descuento = descActiva && subtotal > 0 ? Math.round(subtotal * 0.1) : 0;
  const base = Math.max(0, subtotal - descuento);
  const envio = subtotal === 0 ? 0 : base >= 150000 ? 0 : 8000;
  const total = base + envio;

  function aplicarCupon() {
    if (cupon.trim().toUpperCase() === 'BIENVENIDO10') {
      setDescActiva(true);
      setAviso('Cupón BIENVENIDO10 aplicado (10% dto.).');
    } else {
      setDescActiva(false);
      setAviso('Cupón no válido.');
    }
  }

  function confirmarCompra() {
    setUltimoPedido(null);
    if (!lineas.length) {
      setAviso('El carrito está vacío.');
      return;
    }
    if (!cli.nombre.trim() || !cli.telefono.trim() || !cli.municipio.trim() || !cli.direccion.trim()) {
      setAviso('Completa nombre, teléfono, municipio y dirección.');
      return;
    }
    for (const x of lineas) {
      if (x.cantidad > x.p.stock || x.p.stock <= 0) {
        setAviso('Sin stock suficiente para ' + x.p.nombre + '.');
        return;
      }
    }

    const prodsActualizados = productos.map((p) => {
      const enCarro = lineas.find((x) => x.p.id === p.id);
      if (!enCarro) return p;
      return { ...p, stock: Math.max(0, p.stock - enCarro.cantidad) };
    });

    const pedido = {
      codigo: 'ZNG-' + String(historial.length + 1).padStart(6, '0'),
      fecha: 'Pedido confirmado',
      cliente: { ...cli },
      items: lineas.map((x) => ({
        id: x.p.id, nombre: x.p.nombre, cantidad: x.cantidad, precio: x.p.precio, totalLinea: x.totalLinea,
      })),
      subtotal, descuento, envio, total,
    };

    setProductos(prodsActualizados);
    setHistorial([pedido, ...historial]);
    setCarrito([]);
    setDescActiva(false);
    setCupon('');
    setUltimoPedido(pedido);
    setAviso('Compra simulada ' + pedido.codigo + ' confirmada (sin cobro real).');
  }

  function enviarResena(id) {
    const n = Number(estrellas);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      setAviso('Ingresa un número entero del 1 al 5.');
      return;
    }
    setProductos(productos.map((p) => (p.id === id ? { ...p, resenas: [...(p.resenas || []), n] } : p)));
    setEstrellas('');
    setAviso('Reseña de ' + n + ' estrellas guardada.');
  }

  function limpiarForm() {
    setEditId(null);
    setForm(FORM_VACIO);
  }

  function guardarProd() {
    const precio = Number(form.precio);
    const stock = Number(form.stock);
    if (!form.nombre.trim()) {
      setAviso('El nombre es obligatorio.');
      return;
    }
    if (!Number.isInteger(precio) || precio <= 0) {
      setAviso('El precio debe ser entero mayor a 0.');
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setAviso('El stock debe ser entero mayor o igual a 0.');
      return;
    }
    if (form.descripcion.trim().length < 15) {
      setAviso('La descripción debe tener al menos 15 caracteres.');
      return;
    }

    const limpio = {
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      precio,
      stock,
      descripcion: form.descripcion.trim(),
    };

    if (editId) {
      setProductos(productos.map((p) => (p.id === editId ? { ...p, ...limpio } : p)));
      setAviso('Producto ' + editId + ' actualizado.');
    } else {
      const id = 'PROD-' + String(productos.length + 1).padStart(3, '0');
      setProductos([...productos, { id, ...limpio, resenas: [] }]);
      setAviso('Producto ' + id + ' creado.');
    }
    limpiarForm();
  }

  const detalle = productos.find((p) => p.id === idDetalle);
  const totalCant = carrito.reduce((a, b) => a + b.cantidad, 0);

  if (vista === 'inicio') {
    return (
      <SafeAreaView style={styles.inicio}>
        <View style={styles.inicioContenido}>
          <View style={styles.inicioMarca}>
            <Text style={styles.inicioIcono}>🐾</Text>
            <Text style={styles.inicioTitulo}>ZONGORY</Text>
            <Text style={styles.inicioEslogan}>Tu mascota, nuestra familia.</Text>
          </View>

          <View style={styles.inicioPanel}>
            <Text style={styles.inicioSubtitulo}>Comida, juguetes y cuidados</Text>
            <Text style={styles.inicioTexto}>
              Encuentra productos seleccionados para acompañar a tu mascota todos los días.
            </Text>
            <Pressable style={styles.btnInicio} onPress={() => setVista('catalogo')}>
              <Text style={styles.txtInicio}>Ver productos</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.fondo}>
      <View style={styles.cabecera}>
        <Text style={styles.titulo}>ZONGORY</Text>
        <Text style={styles.eslogan}>Tu mascota, nuestra familia.</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.menu}>
        <Pressable style={styles.btnMenu} onPress={() => { setAviso(''); setVista('catalogo'); }}>
          <Text style={styles.txtMenu}>Catálogo</Text>
        </Pressable>
        <Pressable style={styles.btnMenu} onPress={() => { setAviso(''); setVista('favoritos'); }}>
          <Text style={styles.txtMenu}>Favoritos ({favoritos.length})</Text>
        </Pressable>
        <Pressable style={styles.btnMenu} onPress={() => { setAviso(''); setVista('carrito'); }}>
          <Text style={styles.txtMenu}>Carrito ({totalCant})</Text>
        </Pressable>
        <Pressable style={styles.btnMenu} onPress={() => { setAviso(''); setVista('historial'); }}>
          <Text style={styles.txtMenu}>Historial ({historial.length})</Text>
        </Pressable>
        <Pressable style={styles.btnMenu} onPress={() => { setAviso(''); setVista('vendedor'); }}>
          <Text style={styles.txtMenu}>Vendedor</Text>
        </Pressable>
      </ScrollView>

      {aviso !== '' && (
        <View style={styles.aviso}>
          <Text style={styles.txtAviso}>{aviso}</Text>
          <Pressable onPress={() => setAviso('')}>
            <Text style={styles.bold}>X</Text>
          </Pressable>
        </View>
      )}

      {vista === 'catalogo' && (
        <View style={styles.area}>
          <TextInput
            style={styles.input}
            placeholder="Buscar producto..."
            value={busqueda}
            onChangeText={setBusqueda}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filaScroll}>
            {CATEGORIAS.map((c) => (
              <Pressable key={c} style={catSel === c ? styles.chipOn : styles.chip} onPress={() => setCatSel(c)}>
                <Text style={catSel === c ? styles.txtChipOn : styles.txtChip}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.fila}>
            <Pressable style={orden === 'asc' ? styles.chipOn : styles.chip} onPress={() => setOrden('asc')}>
              <Text style={orden === 'asc' ? styles.txtChipOn : styles.txtChip}>Menor a mayor</Text>
            </Pressable>
            <Pressable style={orden === 'desc' ? styles.chipOn : styles.chip} onPress={() => setOrden('desc')}>
              <Text style={orden === 'desc' ? styles.txtChipOn : styles.txtChip}>Mayor a menor</Text>
            </Pressable>
            <Pressable style={orden === 'none' ? styles.chipOn : styles.chip} onPress={() => setOrden('none')}>
              <Text style={orden === 'none' ? styles.txtChipOn : styles.txtChip}>Sin orden</Text>
            </Pressable>
          </View>
          <FlatList
            data={filtrados}
            keyExtractor={(i) => i.id}
            ListEmptyComponent={<Text style={styles.vacio}>No encontramos productos</Text>}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.catTxt}>{item.categoria}</Text>
                <Text style={styles.bold}>{item.nombre}</Text>
                <Text style={styles.precio}>
                  {cop(item.precio)} · {item.stock > 0 ? 'Stock: ' + item.stock : 'Agotado'}
                </Text>
                <View style={styles.fila}>
                  <Pressable style={styles.btnSec} onPress={() => { setIdDetalle(item.id); setVista('detalle'); }}>
                    <Text style={styles.txtSec}>Detalle</Text>
                  </Pressable>
                  <Pressable style={styles.btnPri} onPress={() => agregarCarrito(item)}>
                    <Text style={styles.txtPri}>Agregar</Text>
                  </Pressable>
                  <Pressable style={styles.btnSec} onPress={() => toggleFav(item.id)}>
                    <Text style={styles.txtSec}>{favoritos.includes(item.id) ? '★ Fav' : '☆ Fav'}</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        </View>
      )}

      {vista === 'detalle' && detalle && (
        <ScrollView style={styles.area}>
          <Pressable style={styles.btnSec} onPress={() => setVista('catalogo')}>
            <Text style={styles.txtSec}>← Volver</Text>
          </Pressable>
          <View style={styles.card}>
            <Text style={styles.catTxt}>{detalle.categoria}</Text>
            <Text style={styles.subtitulo}>{detalle.nombre}</Text>
            <Text style={styles.precio}>{cop(detalle.precio)}</Text>
            <Text>{detalle.stock > 0 ? 'Disponible: ' + detalle.stock : 'Agotado'}</Text>
            <Text style={styles.desc}>{detalle.descripcion}</Text>
            <Text>Calificación: {promResenas(detalle.resenas)}</Text>
            <View style={styles.fila}>
              <Pressable style={styles.btnPri} onPress={() => agregarCarrito(detalle)}>
                <Text style={styles.txtPri}>Agregar al carrito</Text>
              </Pressable>
              <Pressable style={styles.btnSec} onPress={() => toggleFav(detalle.id)}>
                <Text style={styles.txtSec}>{favoritos.includes(detalle.id) ? 'Quitar favorito' : 'Favorito'}</Text>
              </Pressable>
            </View>
            <View style={styles.fila}>
              <TextInput
                style={[styles.input, styles.grow]}
                placeholder="1 a 5"
                keyboardType="numeric"
                value={estrellas}
                onChangeText={setEstrellas}
              />
              <Pressable style={styles.btnSec} onPress={() => enviarResena(detalle.id)}>
                <Text style={styles.txtSec}>Calificar</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      )}

      {vista === 'favoritos' && (
        <ScrollView style={styles.area}>
          <Text style={styles.subtitulo}>Favoritos</Text>
          {favoritos.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.vacio}>No tienes favoritos guardados.</Text>
              <Pressable style={styles.btnPri} onPress={() => setVista('catalogo')}>
                <Text style={styles.txtPri}>Volver al catálogo</Text>
              </Pressable>
            </View>
          ) : (
            favoritos.map((id) => {
              const p = productos.find((x) => x.id === id);
              if (!p) return null;
              return (
                <View key={id} style={styles.card}>
                  <Text style={styles.bold}>{p.nombre}</Text>
                  <Text style={styles.precio}>{cop(p.precio)}</Text>
                  <View style={styles.fila}>
                    <Pressable style={styles.btnPri} onPress={() => agregarCarrito(p)}>
                      <Text style={styles.txtPri}>Agregar</Text>
                    </Pressable>
                    <Pressable style={styles.btnSec} onPress={() => toggleFav(id)}>
                      <Text style={styles.txtSec}>Quitar</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {vista === 'carrito' && (
        <ScrollView style={styles.area}>
          <Text style={styles.subtitulo}>Carrito</Text>
          {lineas.length === 0 ? (
            <Text style={styles.vacio}>Carrito vacío · Total: $0 · Envío: $0</Text>
          ) : (
            <>
              {lineas.map(({ p, cantidad, totalLinea }) => (
                <View key={p.id} style={styles.card}>
                  <Text style={styles.bold}>{p.nombre}</Text>
                  <Text>{cop(p.precio)} x {cantidad} = {cop(totalLinea)}</Text>
                  <View style={styles.fila}>
                    <Pressable style={styles.btnSec} onPress={() => cambiarCant(p.id, -1)}>
                      <Text style={styles.txtSec}>-</Text>
                    </Pressable>
                    <Text style={styles.bold}>{cantidad}</Text>
                    <Pressable style={styles.btnSec} onPress={() => cambiarCant(p.id, 1)}>
                      <Text style={styles.txtSec}>+</Text>
                    </Pressable>
                    <Pressable style={styles.btnSec} onPress={() => quitarItem(p.id)}>
                      <Text style={styles.txtSec}>Eliminar</Text>
                    </Pressable>
                  </View>
                </View>
              ))}

              <View style={styles.card}>
                <View style={styles.fila}>
                  <TextInput
                    style={[styles.input, styles.grow]}
                    placeholder="Cupón BIENVENIDO10"
                    value={cupon}
                    onChangeText={setCupon}
                  />
                  <Pressable style={styles.btnSec} onPress={aplicarCupon}>
                    <Text style={styles.txtSec}>Aplicar</Text>
                  </Pressable>
                </View>
                <Text>Subtotal: {cop(subtotal)}</Text>
                <Text>Descuento: -{cop(descuento)}</Text>
                <Text>Envío: {envio === 0 ? 'Gratis ($0)' : cop(envio)}</Text>
                <Text style={styles.precio}>Total: {cop(total)}</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.bold}>Datos del comprador</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre *"
                  value={cli.nombre}
                  onChangeText={(t) => setCli({ ...cli, nombre: t })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Teléfono *"
                  keyboardType="phone-pad"
                  value={cli.telefono}
                  onChangeText={(t) => setCli({ ...cli, telefono: t })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Municipio *"
                  value={cli.municipio}
                  onChangeText={(t) => setCli({ ...cli, municipio: t })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Dirección *"
                  value={cli.direccion}
                  onChangeText={(t) => setCli({ ...cli, direccion: t })}
                />
                <Text style={styles.nota}>Simulación académica sin cobro real ni datos sensibles.</Text>
                <Pressable style={styles.btnPri} onPress={confirmarCompra}>
                  <Text style={styles.txtPri}>Confirmar compra simulada</Text>
                </Pressable>
              </View>
            </>
          )}

          {ultimoPedido && (
            <View style={styles.card}>
              <Text style={styles.bold}>Pedido {ultimoPedido.codigo} confirmado</Text>
              <Text>Cliente: {ultimoPedido.cliente.nombre} ({ultimoPedido.cliente.municipio})</Text>
              <Text>Total: {cop(ultimoPedido.total)} · Simulación sin cobro real.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {vista === 'historial' && (
        <ScrollView style={styles.area}>
          <Text style={styles.subtitulo}>Historial de pedidos</Text>
          {historial.length === 0 ? (
            <Text style={styles.vacio}>No hay pedidos registrados.</Text>
          ) : (
            historial.map((ped) => (
              <View key={ped.codigo} style={styles.card}>
                <Text style={styles.bold}>{ped.codigo} · {ped.fecha}</Text>
                <Text>{ped.cliente.nombre} - {ped.cliente.municipio}</Text>
                {ped.items.map((it) => (
                  <Text key={it.id}>
                    • {it.nombre} x{it.cantidad} ({cop(it.precio)} c/u) = {cop(it.totalLinea)}
                  </Text>
                ))}
                <Text>Envío: {ped.envio === 0 ? 'Gratis' : cop(ped.envio)} · Total: {cop(ped.total)}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {vista === 'vendedor' && (
        <ScrollView style={styles.area}>
          <Text style={styles.subtitulo}>Panel de vendedor</Text>
          <View style={styles.card}>
            <Text style={styles.bold}>{editId ? 'Editando ' + editId : 'Nuevo producto'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={form.nombre}
              onChangeText={(t) => setForm({ ...form, nombre: t })}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filaScroll}>
              {CATEGORIAS.filter((c) => c !== 'Todas').map((c) => (
                <Pressable key={c} style={form.categoria === c ? styles.chipOn : styles.chip} onPress={() => setForm({ ...form, categoria: c })}>
                  <Text style={form.categoria === c ? styles.txtChipOn : styles.txtChip}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput
              style={styles.input}
              placeholder="Precio COP (> 0)"
              keyboardType="numeric"
              value={form.precio}
              onChangeText={(t) => setForm({ ...form, precio: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Stock (>= 0)"
              keyboardType="numeric"
              value={form.stock}
              onChangeText={(t) => setForm({ ...form, stock: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Descripción (mín. 15 caracteres)"
              value={form.descripcion}
              onChangeText={(t) => setForm({ ...form, descripcion: t })}
            />
            <View style={styles.fila}>
              <Pressable style={styles.btnPri} onPress={guardarProd}>
                <Text style={styles.txtPri}>{editId ? 'Guardar' : 'Crear'}</Text>
              </Pressable>
              {editId && (
                <Pressable style={styles.btnSec} onPress={limpiarForm}>
                  <Text style={styles.txtSec}>Cancelar</Text>
                </Pressable>
              )}
            </View>
          </View>

          {productos.map((p) => (
            <View key={p.id} style={styles.card}>
              <Text style={styles.bold}>{p.id} · {p.nombre}</Text>
              <Text>{p.categoria} · {cop(p.precio)} · Stock: {p.stock}</Text>
              <Pressable
                style={styles.btnSec}
                onPress={() => {
                  setEditId(p.id);
                  setForm({
                    nombre: p.nombre,
                    categoria: p.categoria,
                    precio: String(p.precio),
                    stock: String(p.stock),
                    descripcion: p.descripcion,
                  });
                }}
              >
                <Text style={styles.txtSec}>Editar</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  inicio: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  inicioContenido: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  inicioMarca: {
    alignItems: 'center',
    marginBottom: 28,
  },
  inicioIcono: {
    fontSize: 54,
    marginBottom: 8,
  },
  inicioTitulo: {
    fontSize: 42,
    fontWeight: 'bold',
    letterSpacing: 4,
    color: COLORS.teal,
  },
  inicioEslogan: {
    marginTop: 8,
    fontSize: 16,
    color: COLORS.dark,
  },
  inicioPanel: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.sandy,
    padding: 20,
    alignItems: 'center',
  },
  inicioSubtitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  inicioTexto: {
    textAlign: 'center',
    lineHeight: 20,
    color: COLORS.dark,
    marginBottom: 18,
  },
  btnInicio: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  txtInicio: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cabecera: {
    backgroundColor: COLORS.apricot,
    padding: 14,
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  eslogan: {
    fontSize: 13,
    color: COLORS.dark,
  },
  menu: {
    backgroundColor: '#FFF',
    padding: 8,
    maxHeight: 50,
  },
  btnMenu: {
    backgroundColor: COLORS.sandy,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  txtMenu: {
    color: COLORS.dark,
    fontWeight: 'bold',
    fontSize: 12,
  },
  aviso: {
    backgroundColor: '#E6F4EA',
    padding: 10,
    margin: 10,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  txtAviso: {
    color: COLORS.dark,
    flex: 1,
    fontSize: 13,
  },
  area: {
    flex: 1,
    padding: 12,
  },
  grow: {
    flex: 1,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    color: COLORS.dark,
  },
  filaScroll: {
    marginBottom: 8,
    maxHeight: 36,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  chip: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.sandy,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 6,
  },
  chipOn: {
    backgroundColor: COLORS.teal,
    borderWidth: 1,
    borderColor: COLORS.teal,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 6,
  },
  txtChip: {
    color: COLORS.dark,
    fontSize: 12,
  },
  txtChipOn: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    gap: 4,
  },
  catTxt: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.teal,
  },
  bold: {
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  subtitulo: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  precio: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  desc: {
    fontSize: 13,
    color: COLORS.dark,
    marginVertical: 4,
  },
  btnPri: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  txtPri: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  btnSec: {
    backgroundColor: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.sandy,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  txtSec: {
    color: COLORS.dark,
    fontWeight: 'bold',
    fontSize: 12,
  },
  vacio: {
    fontSize: 14,
    color: COLORS.dark,
    marginVertical: 10,
  },
  nota: {
    fontSize: 12,
    color: '#666',
    marginVertical: 4,
  },
});