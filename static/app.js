const $ = (id) => document.getElementById(id);
let etiquetas = [];
const campos = ['modo','cantidad','unidad','inicio','fin','codigo','ancho','alto'];

function cambiarModo() {
  ['secuencia','unidad','rango'].forEach(m => $('grupo-'+m).classList.toggle('oculto', $('modo').value !== m));
}
function limpiarResultado() {
  etiquetas = [];
  $('total').textContent = '0';
  $('imprimir').disabled = true;
  $('ver-todas').disabled = true;
}
function crearEtiqueta(dato) {
  const elemento = document.createElement('div');
  elemento.className = 'etiqueta-print';
  const titulo = document.createElement('strong');
  titulo.textContent = `PALLET N° ${dato.numero}`;
  const codigo = document.createElement('span');
  codigo.textContent = `COD. MATERIAL: ${dato.codigo}`;
  elemento.append(titulo, codigo);
  return elemento;
}
$('modo').addEventListener('change', cambiarModo);
campos.forEach(campo => $(campo).addEventListener('input', limpiarResultado));
$('formulario').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('error').hidden = true;
  const datos = Object.fromEntries(['modo','cantidad','unidad','inicio','fin','codigo'].map(id => [id, $(id).value]));
  try {
    const respuesta = await fetch('/api/etiquetas', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(datos)});
    const resultado = await respuesta.json();
    if (!respuesta.ok) throw new Error(resultado.error || 'No se pudieron generar las etiquetas.');
    etiquetas = resultado.etiquetas;
    $('total').textContent = String(resultado.total);
    const primera = etiquetas[0];
    $('vista-previa').querySelector('strong').textContent = `PALLET N° ${primera.numero}`;
    $('vista-previa').querySelector('span:last-child').textContent = `COD. MATERIAL: ${primera.codigo}`;
    $('imprimir').disabled = false;
    $('ver-todas').disabled = false;
  } catch (error) { $('error').textContent = error.message; $('error').hidden = false; }
});
function prepararImpresion() {
  const ancho = Number($('ancho').value), alto = Number($('alto').value);
  if (!Number.isFinite(ancho) || ancho < 25 || ancho > 104 || !Number.isFinite(alto) || alto < 20 || alto > 300) {
    $('error').textContent = 'Revisá las medidas de la etiqueta (ancho 25–104 mm; alto 20–300 mm).';
    $('error').hidden = false;
    return false;
  }
  document.documentElement.style.setProperty('--ancho-etiqueta', `${ancho}mm`);
  document.documentElement.style.setProperty('--alto-etiqueta', `${alto}mm`);
  $('area-impresion').replaceChildren(...etiquetas.map(crearEtiqueta));
  return true;
}
$('imprimir').addEventListener('click', () => { if (etiquetas.length && prepararImpresion()) window.print(); });
$('ver-todas').addEventListener('click', () => {
  if (!etiquetas.length || !prepararImpresion()) return;
  const lista = etiquetas.slice(0, 30).map(e => `Pallet ${e.numero} · Material ${e.codigo}`).join('\n');
  alert(lista + (etiquetas.length > 30 ? `\n... y ${etiquetas.length-30} etiquetas más` : ''));
});
