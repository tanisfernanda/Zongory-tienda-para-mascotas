export const COLORS = {
  cream: '#FFF8F0',
  apricot: '#FFDCC2',
  dark: '#2F2A26',
  sandy: '#D8C4A8',
  teal: '#227C74',
};

export const CATEGORIAS = [
  'Todas',
  'Comida',
  'Juguetes',
  'Medicinas',
  'Accesorios',
];

export function obtenerStockTotal(prod) {
  if (Array.isArray(prod.variantes) && prod.variantes.length > 0) {
    return prod.variantes.reduce((acc, v) => acc + Math.max(0, Number(v.stock) || 0), 0);
  }
  return Math.max(0, Number(prod.stock) || 0);
}

export const PRODUCTOS_INICIALES = [
  {
    id: 1,
    nombre: 'Alimento Premium para Perros',
    categoria: 'Comida',
    precio: 85000,
    stock: 25,
    descripcion: 'Alimento seco completo con proteínas y nutrientes para perros adultos.',
    resenas: [5, 4, 5],
    variantes: [
      { id: 'v-1-2kg', etiqueta: 'Bolsa 2 kg', precioFinal: 45000, stock: 10 },
      { id: 'v-1-8kg', etiqueta: 'Bulto 8 kg', precioFinal: 85000, stock: 15 },
      { id: 'v-1-15kg', etiqueta: 'Bulto 15 kg', precioFinal: 145000, stock: 0 },
    ],
  },
  {
    id: 2,
    nombre: 'Alimento para Gatos',
    categoria: 'Comida',
    precio: 62000,
    stock: 18,
    descripcion: 'Alimento balanceado con sabor a pollo para gatos de todas las edades.',
    resenas: [4, 5],
    variantes: [
      { id: 'v-2-1kg', etiqueta: 'Bolsa 1.5 kg', precioFinal: 34000, stock: 8 },
      { id: 'v-2-4kg', etiqueta: 'Bolsa 4 kg', precioFinal: 62000, stock: 10 },
    ],
  },
  {
    id: 3,
    nombre: 'Pelota de Caucho',
    categoria: 'Juguetes',
    precio: 18000,
    stock: 12,
    descripcion: 'Pelota resistente y segura para jugar y ejercitar a tu perro.',
    resenas: [5, 5, 4],
  },
  {
    id: 4,
    nombre: 'Varita con Plumas',
    categoria: 'Juguetes',
    precio: 22000,
    stock: 20,
    descripcion: 'Juguete interactivo con plumas para estimular el juego de los gatos.',
    resenas: [4, 4, 5],
  },
  {
    id: 5,
    nombre: 'Desparasitante Oral',
    categoria: 'Medicinas',
    precio: 28000,
    stock: 10,
    descripcion: 'Medicamento desparasitante para perros y gatos. Sigue las indicaciones del veterinario.',
    resenas: [5, 4],
  },
  {
    id: 6,
    nombre: 'Snacks Saludables para Perros',
    categoria: 'Comida',
    precio: 24000,
    stock: 30,
    descripcion: 'Premios horneados con ingredientes naturales para el entrenamiento diario.',
    resenas: [5, 5, 4],
  },
  {
    id: 7,
    nombre: 'Concentrado para Cachorros',
    categoria: 'Comida',
    precio: 78000,
    stock: 15,
    descripcion: 'Alimento especial con nutrientes para el crecimiento de cachorros.',
    resenas: [5, 4, 5],
  },
  {
    id: 8,
    nombre: 'Arnés Ajustable',
    categoria: 'Accesorios',
    precio: 35000,
    stock: 14,
    descripcion: 'Arnés cómodo y ajustable para pasear perros de manera segura.',
    resenas: [4, 5, 4],
    variantes: [
      { id: 'v-8-s', etiqueta: 'Talla S', precioFinal: 32000, stock: 6 },
      { id: 'v-8-m', etiqueta: 'Talla M', precioFinal: 35000, stock: 5 },
      { id: 'v-8-l', etiqueta: 'Talla L', precioFinal: 38000, stock: 3 },
    ],
  },
  {
    id: 9,
    nombre: 'Correa de Paseo',
    categoria: 'Accesorios',
    precio: 16000,
    stock: 22,
    descripcion: 'Correa resistente con agarre cómodo para paseos diarios.',
    resenas: [5, 4],
  },
  {
    id: 10,
    nombre: 'Shampoo Medicado',
    categoria: 'Medicinas',
    precio: 42000,
    stock: 11,
    descripcion: 'Shampoo suave para mascotas con irritaciones leves de la piel.',
    resenas: [4, 5, 5],
  },
  {
    id: 11,
    nombre: 'Vitamina para Mascotas',
    categoria: 'Medicinas',
    precio: 32000,
    stock: 16,
    descripcion: 'Suplemento vitamínico para apoyar el sistema inmune y la vitalidad.',
    resenas: [5, 4, 4],
  },
  {
    id: 12,
    nombre: 'Plato Antideslizante',
    categoria: 'Accesorios',
    precio: 39000,
    stock: 24,
    descripcion: 'Plato estable para agua o comida que evita derrames durante la alimentación.',
    resenas: [5, 5, 4],
  },
];