import streamlit as st
import uuid
from core.db import get_supabase
from core.queries import get_empleados, get_servicios
from core.documentos import (
    get_documentos, subir_documento, borrar_documento,
    TIPOS_DOCUMENTO, get_icono_tipo, BUCKET as BUCKET_SERVICIOS
)

st.set_page_config(page_title="Documentos", layout="wide")
st.title("Repositorio de documentos")

BUCKET_EMPLEADOS = "docs-empleados"

TIPOS_DOC_EMPLEADO = [
    "Contrato de trabajo",
    "DNI / Identificación",
    "Permiso de conducir",
    "Certificado médico",
    "Formación / Título",
    "Nómina",
    "Parte de baja / alta",
    "Reconocimiento médico",
    "Otro",
]

TIPO_COLORES = {
    "Contrato":                ("📜", "#EDE9FE", "#4C1D95"),
    "Contrato de trabajo":     ("📜", "#EDE9FE", "#4C1D95"),
    "Seguro vehículo":         ("🛡️", "#DCFCE7", "#166534"),
    "Permiso / Autorización":  ("✅", "#FEF9C3", "#854D0E"),
    "Factura":                 ("💶", "#FEE2E2", "#991B1B"),
    "Parte de trabajo":        ("📋", "#E0F2FE", "#0C4A6E"),
    "Ficha técnica vehículo":  ("🔧", "#F3F4F6", "#374151"),
    "Documentación empleado":  ("👤", "#FEF3C7", "#92400E"),
    "Acuerdo de servicio":     ("🤝", "#F0FDF4", "#14532D"),
    "DNI / Identificación":    ("🪪", "#F0F9FF", "#0C4A6E"),
    "Permiso de conducir":     ("🚗", "#FEF9C3", "#854D0E"),
    "Certificado médico":      ("🏥", "#FEE2E2", "#991B1B"),
    "Formación / Título":      ("🎓", "#F5F3FF", "#4C1D95"),
    "Nómina":                  ("💶", "#FEE2E2", "#991B1B"),
    "Parte de baja / alta":    ("📋", "#E0F2FE", "#0C4A6E"),
    "Reconocimiento médico":   ("🩺", "#DCFCE7", "#166534"),
    "Otro":                    ("📎", "#F9FAFB", "#4B5563"),
}


def _render_docs(docs: list, key_prefix: str, bucket: str):
    if not docs:
        st.info("No hay documentos todavía.")
        return
    st.write(f"**{len(docs)} documento(s)**")
    for doc in docs:
        tipo = doc.get("tipo", "Otro")
        ico_tipo, bg, fg = TIPO_COLORES.get(tipo, ("📎", "#F9FAFB", "#4B5563"))
        ico_arch = get_icono_tipo(doc.get("nombre_archivo", ""))
        with st.container(border=True):
            c1, c2, c3, c4, c5 = st.columns([0.4, 2.5, 1.5, 2, 1.2])
            c1.markdown(f"<div style='font-size:1.4rem;text-align:center'>{ico_arch}</div>",
                        unsafe_allow_html=True)
            with c2:
                st.write(f"**{doc['nombre']}**")
                if doc.get("descripcion"):
                    st.caption(doc["descripcion"])
            c3.markdown(
                f"<span style='background:{bg};color:{fg};padding:2px 8px;"
                f"border-radius:6px;font-size:.75rem'>{ico_tipo} {tipo}</span>",
                unsafe_allow_html=True
            )
            c4.caption(f"Subido: {str(doc.get('fecha_subida',''))[:10]}")
            with c5:
                if doc.get("url_publica"):
                    st.link_button("⬇️", doc["url_publica"])
                if st.button("🗑️", key=f"{key_prefix}_{doc['id']}", help="Eliminar"):
                    sb = get_supabase()
                    try:
                        sb.storage.from_(bucket).remove([doc["storage_path"]])
                    except Exception:
                        pass
                    tabla = "documentos_empleado" if "empleado" in key_prefix else "documentos_servicio"
                    sb.table(tabla).delete().eq("id", doc["id"]).execute()
                    st.success("Eliminado.")
                    st.rerun()


def _form_subir(entidad_id: int, entidad: str, tipos: list, bucket: str, key_form: str):
    with st.expander("➕ Subir documento", expanded=False):
        with st.form(key_form):
            c1, c2 = st.columns(2)
            nombre = c1.text_input("Nombre del documento *")
            tipo   = c2.selectbox("Tipo *", tipos)
            desc   = st.text_input("Descripción (opcional)")
            arch   = st.file_uploader(
                "Archivo (PDF, Word, Excel, imagen...)",
                type=["pdf","doc","docx","xls","xlsx","jpg","jpeg","png","txt","zip"]
            )
            if st.form_submit_button("📤 Subir", type="primary"):
                if not nombre:
                    st.error("El nombre es obligatorio.")
                elif not arch:
                    st.error("Selecciona un archivo.")
                else:
                    with st.spinner("Subiendo..."):
                        try:
                            sb  = get_supabase()
                            ext = arch.name.split(".")[-1].lower() if "." in arch.name else "bin"
                            uid = uuid.uuid4().hex[:8]
                            path = f"{entidad}_{entidad_id}/{uid}_{arch.name}"
                            content_types = {
                                "pdf":"application/pdf","jpg":"image/jpeg","jpeg":"image/jpeg",
                                "png":"image/png","doc":"application/msword",
                                "docx":"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                "xls":"application/vnd.ms-excel",
                                "xlsx":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                "txt":"text/plain",
                            }
                            ct = content_types.get(ext, "application/octet-stream")
                            sb.storage.from_(bucket).upload(
                                path=path, file=arch.read(),
                                file_options={"content-type": ct, "upsert": "true"}
                            )
                            url = sb.storage.from_(bucket).get_public_url(path)
                            tabla = "documentos_empleado" if entidad == "empleado" else "documentos_servicio"
                            id_field = "empleado_id" if entidad == "empleado" else "servicio_id"
                            sb.table(tabla).insert({
                                id_field: entidad_id,
                                "nombre": nombre, "nombre_archivo": arch.name,
                                "tipo": tipo, "descripcion": desc or None,
                                "storage_path": path, "url_publica": url,
                            }).execute()
                            st.success(f"**{nombre}** subido.")
                            st.rerun()
                        except Exception as e:
                            st.error(f"Error: {e}")


# ─────────────────────────────────────────────────────────────────
# TABS PRINCIPALES
# ─────────────────────────────────────────────────────────────────
tab_emp, tab_srv = st.tabs(["📂 Documentos por empleado", "📁 Documentos por servicio"])

# ── DOCUMENTOS POR EMPLEADO ───────────────────────────────────────
with tab_emp:
    empleados = get_empleados()
    if not empleados:
        st.info("No hay empleados registrados.")
    else:
        opts = {f"{e['apellidos']}, {e['nombre']}": e for e in empleados}
        sel  = st.selectbox("Selecciona empleado", list(opts.keys()), key="doc_emp_sel")
        emp  = opts[sel]

        st.markdown(f"#### 👤 {emp['nombre']} {emp['apellidos']}")
        if emp.get("dni"):
            st.caption(f"DNI: {emp['dni']}")

        try:
            sb  = get_supabase()
            res = sb.table("documentos_empleado").select("*").eq("empleado_id", emp["id"]).order("fecha_subida", desc=True).execute()
            docs_emp = res.data
            tabla_ok = True
        except Exception:
            docs_emp = []
            tabla_ok = False

        if not tabla_ok:
            st.warning("La tabla `documentos_empleado` no existe. Ejecuta el SQL de abajo en Supabase.")
            st.code("""
CREATE TABLE IF NOT EXISTS documentos_empleado (
    id              BIGSERIAL PRIMARY KEY,
    empleado_id     BIGINT NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
    nombre          TEXT NOT NULL,
    nombre_archivo  TEXT NOT NULL,
    tipo            TEXT NOT NULL,
    descripcion     TEXT,
    storage_path    TEXT NOT NULL,
    url_publica     TEXT,
    fecha_subida    TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO storage.buckets (id, name, public)
VALUES ('docs-empleados', 'docs-empleados', true)
ON CONFLICT (id) DO NOTHING;
            """, language="sql")
        else:
            _form_subir(emp["id"], "empleado", TIPOS_DOC_EMPLEADO, BUCKET_EMPLEADOS, f"form_doc_emp_{emp['id']}")
            _render_docs(docs_emp, "del_emp_doc", BUCKET_EMPLEADOS)

# ── DOCUMENTOS POR SERVICIO ───────────────────────────────────────
with tab_srv:
    servicios = get_servicios()
    if not servicios:
        st.info("No hay servicios registrados.")
    else:
        opts_srv = {f"{s['codigo']} — {s['descripcion']}": s for s in servicios}
        sel_srv  = st.selectbox("Selecciona servicio", list(opts_srv.keys()), key="doc_srv_sel")
        srv      = opts_srv[sel_srv]

        st.markdown(f"#### 🚐 {srv['codigo']} — {srv['descripcion']}")
        if srv.get("empresa_nombre"):
            st.caption(f"🏢 {srv['empresa_nombre']}")

        try:
            docs_srv = get_documentos(srv["id"])
            tabla_srv_ok = True
        except Exception:
            docs_srv = []
            tabla_srv_ok = False

        if not tabla_srv_ok:
            st.warning("La tabla `documentos_servicio` no existe. Ejecuta el SQL de esquema en Supabase.")
        else:
            _form_subir(srv["id"], "servicio", TIPOS_DOCUMENTO, BUCKET_SERVICIOS, f"form_doc_srv_{srv['id']}")
            _render_docs(docs_srv, "del_srv_doc", BUCKET_SERVICIOS)
