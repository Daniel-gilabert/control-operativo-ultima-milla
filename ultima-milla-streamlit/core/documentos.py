"""
Helper para gestión de documentos por servicio en Supabase Storage.
Bucket: docs-servicios (debe estar creado como público)
"""
import uuid
from datetime import datetime
from .db import get_supabase

BUCKET = "docs-servicios"

TIPOS_DOCUMENTO = [
    "Contrato",
    "Seguro vehículo",
    "Permiso / Autorización",
    "Factura",
    "Parte de trabajo",
    "Ficha técnica vehículo",
    "Documentación empleado",
    "Acuerdo de servicio",
    "Otro",
]


def subir_documento(
    servicio_id: int,
    nombre: str,
    tipo: str,
    archivo_bytes: bytes,
    nombre_archivo: str,
    descripcion: str = None,
    subido_por: str = None,
) -> dict:
    """
    Sube un documento al bucket y registra en la BD.
    Devuelve el registro creado.
    """
    sb  = get_supabase()
    ext = nombre_archivo.split(".")[-1].lower() if "." in nombre_archivo else "bin"
    uid = uuid.uuid4().hex[:8]
    path = f"servicio_{servicio_id}/{uid}_{nombre_archivo}"

    content_types = {
        "pdf": "application/pdf",
        "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
        "doc": "application/msword",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "xls": "application/vnd.ms-excel",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "txt": "text/plain",
    }
    ct = content_types.get(ext, "application/octet-stream")

    sb.storage.from_(BUCKET).upload(
        path=path,
        file=archivo_bytes,
        file_options={"content-type": ct, "upsert": "true"},
    )

    url = sb.storage.from_(BUCKET).get_public_url(path)

    res = sb.table("documentos_servicio").insert({
        "servicio_id":    servicio_id,
        "nombre":         nombre,
        "nombre_archivo": nombre_archivo,
        "tipo":           tipo,
        "descripcion":    descripcion or None,
        "storage_path":   path,
        "url_publica":    url,
        "subido_por":     subido_por or None,
    }).execute()

    return res.data[0]


def get_documentos(servicio_id: int) -> list[dict]:
    """Lista todos los documentos de un servicio ordenados por fecha."""
    sb  = get_supabase()
    res = (sb.table("documentos_servicio")
           .select("*")
           .eq("servicio_id", servicio_id)
           .order("fecha_subida", desc=True)
           .execute())
    return res.data


def borrar_documento(doc_id: int, storage_path: str) -> None:
    """Elimina el documento del storage y de la BD."""
    sb = get_supabase()
    try:
        sb.storage.from_(BUCKET).remove([storage_path])
    except Exception:
        pass
    sb.table("documentos_servicio").delete().eq("id", doc_id).execute()


def get_icono_tipo(nombre_archivo: str) -> str:
    """Devuelve un emoji según la extensión del archivo."""
    ext = nombre_archivo.split(".")[-1].lower() if "." in nombre_archivo else ""
    return {
        "pdf":  "📄",
        "doc":  "📝", "docx": "📝",
        "xls":  "📊", "xlsx": "📊",
        "jpg":  "🖼️", "jpeg": "🖼️", "png": "🖼️",
        "txt":  "📃",
        "zip":  "🗜️", "rar": "🗜️",
    }.get(ext, "📎")
