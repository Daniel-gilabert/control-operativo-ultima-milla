import logging
import streamlit as st
from datetime import datetime
from repositories.base import get_client

logger = logging.getLogger(__name__)

BUCKET = "fichajes"


@st.cache_data(ttl=120, show_spinner=False)
def _fetch_historico(responsable_id: str) -> list[dict]:
    client = get_client()
    r = (
        client.table("historico_mensual")
        .select("*")
        .eq("responsable_id", responsable_id)
        .order("anno", desc=True)
        .order("mes", desc=True)
        .execute()
    )
    return r.data


class HistoricoRepository:

    # ── Resumen mensual ───────────────────────────────────────────────────────

    def guardar_resumen(
        self, responsable_id: str, anno: int, mes: int, resumen_global: list[dict]
    ) -> None:
        client = get_client()
        client.table("historico_mensual").delete().eq(
            "responsable_id", responsable_id
        ).eq("anno", anno).eq("mes", mes).execute()

        filas = [
            {
                "responsable_id": responsable_id,
                "anno": anno,
                "mes": mes,
                "empleado_id": d["id"],
                "nombre": d["nombre"],
                "laborables": d["laborables"],
                "fichados": d["fichados"],
                "errores": d["errores"],
                "sin_fichar": d["sin_fichar"],
                "horas_reales": d["horas_reales"],
                "objetivo": d["objetivo"],
                "diferencia": d["diferencia"],
                "horas_extra": d["horas_extra"],
            }
            for d in resumen_global
        ]
        client.table("historico_mensual").insert(filas).execute()
        st.cache_data.clear()
        logger.info("Histórico guardado: %s %d/%d — %d empleados", responsable_id, mes, anno, len(filas))

    def get_historico(self, responsable_id: str) -> list[dict]:
        return _fetch_historico(responsable_id)

    def delete_mes(self, responsable_id: str, anno: int, mes: int) -> None:
        client = get_client()
        client.table("historico_mensual").delete().eq(
            "responsable_id", responsable_id
        ).eq("anno", anno).eq("mes", mes).execute()
        st.cache_data.clear()
        logger.info("Histórico eliminado: %s %d/%d", responsable_id, mes, anno)

    # ── Archivos Excel en Supabase Storage ───────────────────────────────────

    def subir_excel(
        self, responsable_id: str, anno: int, mes: int, archivo_bytes: bytes
    ) -> bool:
        try:
            client = get_client()
            path = f"{responsable_id}/{anno}_{mes:02d}.xlsx"
            client.storage.from_(BUCKET).upload(
                path, archivo_bytes,
                {"content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                 "x-upsert": "true"},
            )
            st.cache_data.clear()
            logger.info("Excel subido a storage: %s", path)
            return True
        except Exception as e:
            logger.error("Error subiendo Excel a storage: %s", e)
            return False

    def listar_excels(self, responsable_id: str) -> list[dict]:
        try:
            client = get_client()
            archivos = client.storage.from_(BUCKET).list(responsable_id)
            return archivos or []
        except Exception as e:
            logger.error("Error listando storage: %s", e)
            return []

    def descargar_excel(self, responsable_id: str, nombre_archivo: str) -> bytes | None:
        try:
            client = get_client()
            path = f"{responsable_id}/{nombre_archivo}"
            data = client.storage.from_(BUCKET).download(path)
            return data
        except Exception as e:
            logger.error("Error descargando Excel: %s", e)
            return None

    def borrar_excel(self, responsable_id: str, nombre_archivo: str) -> bool:
        try:
            client = get_client()
            path = f"{responsable_id}/{nombre_archivo}"
            client.storage.from_(BUCKET).remove([path])
            st.cache_data.clear()
            logger.info("Excel borrado: %s", path)
            return True
        except Exception as e:
            logger.error("Error borrando Excel: %s", e)
            return False
