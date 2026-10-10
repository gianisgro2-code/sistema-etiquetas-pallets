"""Sistema local de etiquetas de pallets. Primer prototipo con Flask."""
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)
MAX_ETIQUETAS = 500  # Límite preventivo configurable


def entero_positivo(valor, nombre, permite_cero=False):
    texto = str(valor).strip()
    if not texto.isdigit():
        raise ValueError(f"{nombre}: ingresá un número entero válido.")
    numero = int(texto)
    if numero < (0 if permite_cero else 1):
        raise ValueError(f"{nombre}: ingresá un número mayor que cero.")
    return numero


def generar_etiquetas(datos):
    """Devuelve una lista de etiquetas. No envía trabajos a la impresora."""
    modo = datos.get("modo", "")
    codigo = str(datos.get("codigo", "")).strip()
    if len(codigo) != 4 or not codigo.isdigit():
        raise ValueError("El código de material debe tener exactamente 4 dígitos.")

    if modo == "secuencia":
        cantidad = entero_positivo(datos.get("cantidad", ""), "Cantidad")
        if cantidad > MAX_ETIQUETAS:
            raise ValueError(f"No se pueden generar más de {MAX_ETIQUETAS} etiquetas por lote.")
        numeros = range(1, cantidad + 1)
    elif modo == "unidad":
        numero = entero_positivo(datos.get("unidad", ""), "Número de pallet")
        numeros = [numero]
    elif modo == "rango":
        inicio = entero_positivo(datos.get("inicio", ""), "Pallet inicial")
        fin = entero_positivo(datos.get("fin", ""), "Pallet final")
        if fin < inicio:
            raise ValueError("El número final no puede ser menor que el inicial.")
        if fin - inicio + 1 > MAX_ETIQUETAS:
            raise ValueError(f"No se pueden generar más de {MAX_ETIQUETAS} etiquetas por lote.")
        numeros = range(inicio, fin + 1)
    else:
        raise ValueError("Seleccioná un modo de impresión válido.")

    return [{"numero": numero, "codigo": codigo} for numero in numeros]


@app.get("/")
def inicio():
    return render_template("index.html")


@app.post("/api/etiquetas")
def etiquetas():
    try:
        datos = request.get_json(silent=True)
        if not isinstance(datos, dict):
            raise ValueError("No se recibieron datos válidos.")
        resultado = generar_etiquetas(datos)
        return jsonify({"etiquetas": resultado, "total": len(resultado)})
    except ValueError as error:
        return jsonify({"error": str(error)}), 400


if __name__ == "__main__":
    # Solo accesible desde esta PC; no publicar en internet sin autenticación.
    app.run(host="127.0.0.1", port=5000, debug=False)
