"""
Lógica pura de cálculo de estado operativo.
No accede a la base de datos.
Adaptada a la estructura real de vehiculos en Supabase.
"""
from datetime import date
from .models import (
    Empleado, Vehiculo, Sustitucion, Ausencia, Incidencia,
    EstadoServicio, MotivoEstado
)

DIAS_ALERTA = 30


def _en_rango(fecha: date, inicio: date, fin: date) -> bool:
    return inicio <= fecha <= fin


def _dias_hasta(fecha: date, vencimiento: date | None) -> int | None:
    if vencimiento is None:
        return None
    return (vencimiento - fecha).days


def calcular_estado(
    servicio_id: int,
    fecha: date,
    empleado: Empleado,
    vehiculo: Vehiculo,
    ausencias: list[Ausencia],
    incidencias: list[Incidencia],
    sustitucion_empleado: Sustitucion | None = None,
    sustitucion_vehiculo: Sustitucion | None = None,
) -> EstadoServicio:

    motivos: list[MotivoEstado] = []

    # ── CAUSAS NO_OPERATIVO ─────────────────────────────────────
    ausencia_activa = next(
        (a for a in ausencias if _en_rango(fecha, a.fecha_inicio, a.fecha_fin)),
        None
    )
    if ausencia_activa:
        motivos.append(MotivoEstado(
            codigo="EMPLEADO_AUSENTE",
            descripcion=f"{empleado.nombre} {empleado.apellidos} ausente ({ausencia_activa.tipo})"
        ))

    incidencia_grave = next(
        (i for i in incidencias
         if i.gravedad == "grave"
         and _en_rango(fecha, i.fecha_inicio, i.fecha_fin or date(9999, 12, 31))),
        None
    )
    if incidencia_grave:
        motivos.append(MotivoEstado(
            codigo="VEHICULO_INCIDENCIA_GRAVE",
            descripcion=f"Vehículo {vehiculo.matricula}: {incidencia_grave.descripcion}"
        ))

    dias_itv = _dias_hasta(fecha, vehiculo.itv_vigente_hasta)
    if dias_itv is not None and dias_itv < 0:
        motivos.append(MotivoEstado(
            codigo="ITV_VENCIDA",
            descripcion=f"ITV vencida el {vehiculo.itv_vigente_hasta} (hace {abs(dias_itv)} días)"
        ))

    dias_seg = _dias_hasta(fecha, vehiculo.seguro_vigente_hasta)
    if dias_seg is not None and dias_seg < 0:
        motivos.append(MotivoEstado(
            codigo="SEGURO_VENCIDO",
            descripcion=f"Seguro vencido el {vehiculo.seguro_vigente_hasta} (hace {abs(dias_seg)} días)"
        ))

    codigos_no_op = {"EMPLEADO_AUSENTE", "VEHICULO_INCIDENCIA_GRAVE", "ITV_VENCIDA", "SEGURO_VENCIDO"}
    if any(m.codigo in codigos_no_op for m in motivos):
        return _build(servicio_id, fecha, "NO_OPERATIVO", motivos, empleado, vehiculo,
                      sustitucion_empleado, sustitucion_vehiculo)

    # ── CAUSAS EN_RIESGO ────────────────────────────────────────
    if dias_itv is None:
        motivos.append(MotivoEstado(
            codigo="ITV_SIN_FECHA",
            descripcion=f"Vehículo {vehiculo.matricula}: fecha de ITV no registrada"
        ))
    elif 0 <= dias_itv <= DIAS_ALERTA:
        motivos.append(MotivoEstado(
            codigo="ITV_PROXIMA",
            descripcion=f"ITV vence en {dias_itv} días ({vehiculo.itv_vigente_hasta})"
        ))

    if dias_seg is None:
        motivos.append(MotivoEstado(
            codigo="SEGURO_SIN_FECHA",
            descripcion=f"Vehículo {vehiculo.matricula}: fecha de seguro no registrada"
        ))
    elif 0 <= dias_seg <= DIAS_ALERTA:
        motivos.append(MotivoEstado(
            codigo="SEGURO_PROXIMO",
            descripcion=f"Seguro vence en {dias_seg} días ({vehiculo.seguro_vigente_hasta})"
        ))

    incidencia_leve = next(
        (i for i in incidencias
         if i.gravedad == "leve"
         and _en_rango(fecha, i.fecha_inicio, i.fecha_fin or date(9999, 12, 31))),
        None
    )
    if incidencia_leve:
        motivos.append(MotivoEstado(
            codigo="VEHICULO_INCIDENCIA_LEVE",
            descripcion=f"Vehículo {vehiculo.matricula}: incidencia leve — {incidencia_leve.descripcion}"
        ))

    estado = "EN_RIESGO" if motivos else "OPERATIVO"
    return _build(servicio_id, fecha, estado, motivos, empleado, vehiculo,
                  sustitucion_empleado, sustitucion_vehiculo)


def _build(servicio_id, fecha, estado, motivos, empleado, vehiculo,
           sust_emp, sust_veh) -> EstadoServicio:
    return EstadoServicio(
        servicio_id=servicio_id,
        fecha=fecha,
        estado=estado,
        motivos=motivos,
        empleado_nombre=f"{empleado.nombre} {empleado.apellidos}",
        vehiculo_matricula=vehiculo.matricula,
        vehiculo_marca_modelo=f"{vehiculo.marca} {vehiculo.modelo}",
        es_sustitucion_empleado=sust_emp is not None,
        es_sustitucion_vehiculo=sust_veh is not None,
    )
