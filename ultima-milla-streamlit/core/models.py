from dataclasses import dataclass, field
from datetime import date
from typing import Optional


@dataclass
class Empleado:
    id: int
    nombre: str
    apellidos: str
    telefono: Optional[str] = None
    email: Optional[str] = None


@dataclass
class Vehiculo:
    # Columnas reales de la tabla vehiculos en Supabase
    id: int
    id_vehiculo: str
    matricula: str
    marca: str
    modelo: str
    tipo: str                           # propiedad / renting
    itv_vigente_hasta: Optional[date]   # puede ser None
    seguro_vigente_hasta: Optional[date]
    bastidor: Optional[str] = None
    aseguradora: Optional[str] = None
    poliza: Optional[str] = None


@dataclass
class Sustitucion:
    id: int
    servicio_id: int
    tipo: str
    empleado_id: Optional[int]
    vehiculo_id: Optional[int]
    fecha_inicio: date
    fecha_fin: date
    motivo: Optional[str] = None


@dataclass
class Ausencia:
    id: int
    empleado_id: int
    fecha_inicio: date
    fecha_fin: date
    tipo: str
    observaciones: Optional[str] = None


@dataclass
class Incidencia:
    id: int
    vehiculo_id: int
    gravedad: str           # leve / grave
    descripcion: str
    fecha_inicio: date
    fecha_fin: Optional[date] = None    # None = abierta


@dataclass
class MotivoEstado:
    codigo: str
    descripcion: str


@dataclass
class EstadoServicio:
    servicio_id: int
    fecha: date
    estado: str             # OPERATIVO | EN_RIESGO | NO_OPERATIVO
    motivos: list[MotivoEstado] = field(default_factory=list)
    empleado_nombre: str = ""
    vehiculo_matricula: str = ""
    vehiculo_marca_modelo: str = ""
    es_sustitucion_empleado: bool = False
    es_sustitucion_vehiculo: bool = False
