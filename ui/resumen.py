import streamlit as st
import pandas as pd
from models.empleado import Empleado
from services.calculo_service import CalculoService
from services.informe_pdf_service import InformePDFService
from services.informe_excel_service import InformeExcelService
from datetime import date
import os

_calc = CalculoService()

MESES_ES = {
    1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
    5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
    9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre",
}

LOGO_PATH = "assets/logo-prode.png" if os.path.exists("assets/logo-prode.png") else None


def render_resumen(
    empleados: list[Empleado],
    df_fichajes: pd.DataFrame,
    mapa_festivos: dict[str, set[date]],
    mapa_incidencias: dict[str, set[date]],
    anno: int,
    mes: int,
) -> list[dict]:
    nombre_mes = MESES_ES.get(mes, str(mes))
    st.subheader(f"Resumen mensual — {nombre_mes} {anno}")

    if not empleados:
        st.warning("No hay empleados asignados.")
        return []

    pdf_svc = InformePDFService(logo_path=LOGO_PATH)
    xls_svc = InformeExcelService()

    resultados = _calc.calcular_resumen_global(
        empleados, df_fichajes, mapa_festivos, mapa_incidencias, anno, mes
    )

    for d in resultados:
        if d["sin_fichar"] == 0:
            color = "#d4edda"
        elif d["sin_fichar"] < 3:
            color = "#ffe5b4"
        else:
            color = "#f8d7da"

        diferencia_str = f"+{d['diferencia']}" if d["diferencia"] > 0 else str(d["diferencia"])
        nombre_safe = d["nombre"].replace(" ", "_")

        col_info, col_pdf, col_xls = st.columns([8, 1, 1])

        with col_info:
            st.markdown(
                f"""
                <div style="
                    background:{color};padding:10px 14px;border-radius:8px;
                    font-size:13px;line-height:1.6;margin-top:4px;
                ">
                    <strong>{d['nombre']}</strong>
                    &nbsp;|&nbsp; Laborables: <strong>{d['laborables']}</strong>
                    &nbsp;|&nbsp; Fichados: <strong>{d['fichados']}</strong>
                    &nbsp;|&nbsp; Errores: <strong>{d['errores']}</strong>
                    &nbsp;|&nbsp; Sin fichar: <strong>{d['sin_fichar']}</strong>
                    &nbsp;|&nbsp; Objetivo: <strong>{d['objetivo']} h</strong>
                    &nbsp;|&nbsp; Horas reales: <strong>{d['horas_reales']} h</strong>
                    &nbsp;|&nbsp; Diferencia: <strong>{diferencia_str} h</strong>
                    &nbsp;|&nbsp; Extra: <strong>{d['horas_extra']} h</strong>
                </div>
                """,
                unsafe_allow_html=True,
            )

        with col_pdf:
            pdf_bytes = pdf_svc.generar_pdf_individual(d, mes, anno)
            st.download_button(
                label="PDF",
                data=pdf_bytes,
                file_name=f"{nombre_safe}_{nombre_mes}_{anno}.pdf",
                mime="application/pdf",
                use_container_width=True,
                key=f"pdf_inline_{d['id']}",
            )

        with col_xls:
            xls_bytes = xls_svc.generar_excel_individual(d, mes, anno)
            st.download_button(
                label="XLS",
                data=xls_bytes,
                file_name=f"{nombre_safe}_{nombre_mes}_{anno}.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                use_container_width=True,
                key=f"xls_inline_{d['id']}",
            )

    return resultados
