import logging
import streamlit as st
from repositories.base import get_client

logger = logging.getLogger(__name__)

DOMINIO_PERMITIDO = "prode.es"


def registrar(
    email: str,
    accion: str,
    detalle: str = "",
    resultado: str = "ok",
) -> None:
    try:
        client = get_client()
        client.table("auditoria").insert({
            "email": email,
            "accion": accion,
            "detalle": detalle[:500] if detalle else "",
            "resultado": resultado,
        }).execute()
    except Exception as exc:
        logger.warning("No se pudo guardar en auditoría: %s", exc)


def get_ultimos(limit: int = 200) -> list[dict]:
    try:
        client = get_client()
        r = (
            client.table("auditoria")
            .select("*")
            .order("ts", desc=True)
            .limit(limit)
            .execute()
        )
        return r.data
    except Exception as exc:
        logger.warning("Error al leer auditoría: %s", exc)
        return []
