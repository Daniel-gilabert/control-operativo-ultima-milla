"""
Helper para subir y obtener fotos desde Supabase Storage.
Bucket: fotos-app (debe estar creado como público en Supabase)
"""
import io
from .db import get_supabase

BUCKET = "fotos-app"


def get_url_publica(path: str) -> str:
    """Devuelve la URL pública de un archivo en Storage."""
    sb = get_supabase()
    return sb.storage.from_(BUCKET).get_public_url(path)


def subir_foto_empleado(empleado_id: int, imagen_bytes: bytes, extension: str = "jpg") -> str:
    """
    Sube la foto de un empleado y actualiza su foto_url en la BD.
    Devuelve la URL pública.
    """
    sb   = get_supabase()
    path = f"empleados/{empleado_id}.{extension}"

    # Eliminar si ya existe
    try:
        sb.storage.from_(BUCKET).remove([path])
    except Exception:
        pass

    # Subir nueva foto
    content_type = f"image/{extension.replace('jpg','jpeg')}"
    sb.storage.from_(BUCKET).upload(
        path=path,
        file=imagen_bytes,
        file_options={"content-type": content_type, "upsert": "true"},
    )

    url = get_url_publica(path)
    # Actualizar columna foto_url en empleados
    sb.table("empleados").update({"foto_url": url}).eq("id", empleado_id).execute()
    return url


def subir_foto_marca(marca: str, imagen_bytes: bytes, extension: str = "jpg") -> str:
    """
    Sube la foto genérica de una marca de vehículo.
    Devuelve la URL pública.
    """
    sb   = get_supabase()
    path = f"marcas/{marca.lower().replace(' ', '_')}.{extension}"

    try:
        sb.storage.from_(BUCKET).remove([path])
    except Exception:
        pass

    content_type = f"image/{extension.replace('jpg','jpeg')}"
    sb.storage.from_(BUCKET).upload(
        path=path,
        file=imagen_bytes,
        file_options={"content-type": content_type, "upsert": "true"},
    )

    url = get_url_publica(path)
    sb.table("marcas_vehiculos").update({"foto_url": url}).eq("marca", marca).execute()
    return url


def get_fotos_marcas() -> dict[str, str | None]:
    """Devuelve {marca: foto_url} para todas las marcas."""
    sb  = get_supabase()
    res = sb.table("marcas_vehiculos").select("marca, foto_url").execute()
    return {r["marca"]: r.get("foto_url") for r in res.data}


def get_foto_empleado(empleado_id: int) -> str | None:
    """Devuelve la foto_url del empleado o None."""
    sb  = get_supabase()
    res = sb.table("empleados").select("foto_url").eq("id", empleado_id).single().execute()
    return res.data.get("foto_url") if res.data else None
