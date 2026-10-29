import datetime
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    Index
)
from sqlalchemy.orm import relationship
from app.db.database import Base

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class Machine(Base):
    __tablename__ = "machines"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)
    location = Column(String(100), nullable=True)
    installation_date = Column(String(30), nullable=True)
    status = Column(String(20), default="NORMAL", nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships with cascade deletion
    readings = relationship("SensorReading", back_populates="machine", cascade="all, delete-orphan", passive_deletes=True)
    predictions = relationship("Prediction", back_populates="machine", cascade="all, delete-orphan", passive_deletes=True)
    alerts = relationship("Alert", back_populates="machine", cascade="all, delete-orphan", passive_deletes=True)
    recommendations = relationship("MaintenanceRecommendation", back_populates="machine", cascade="all, delete-orphan", passive_deletes=True)

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String(50), ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    temperature = Column(Float, nullable=False)        # °C
    vibration = Column(Float, nullable=False)          # mm/s
    rotational_speed = Column(Float, nullable=False)   # RPM
    pressure = Column(Float, nullable=False)           # bar
    operating_hours = Column(Float, nullable=False)    # hours
    is_simulated = Column(Boolean, default=True, nullable=False)

    machine = relationship("Machine", back_populates="readings")

    __table_args__ = (
        Index("idx_reading_machine_time", "machine_id", "timestamp"),
    )

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String(50), ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    predicted_condition = Column(String(30), nullable=False)  # NORMAL, WARNING, HIGH RISK
    failure_risk_score = Column(Float, nullable=False)        # 0.0 - 100.0%
    health_score = Column(Float, nullable=False)              # 0.0 - 100.0
    contributing_factors = Column(Text, default="[]", nullable=False)  # JSON encoded list
    recommendations = Column(Text, default="[]", nullable=False)       # JSON encoded list
    model_version = Column(String(50), default="rf-v1.0", nullable=False)

    machine = relationship("Machine", back_populates="predictions")

    __table_args__ = (
        Index("idx_pred_machine_time", "machine_id", "timestamp"),
    )

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String(50), ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    machine_name = Column(String(100), nullable=False)
    alert_type = Column(String(50), nullable=False)          # e.g., OVERHEATING, HIGH_VIBRATION, etc.
    severity = Column(String(20), nullable=False)            # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)
    is_acknowledged = Column(Boolean, default=False, nullable=False, index=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    recommended_action = Column(Text, nullable=False)

    machine = relationship("Machine", back_populates="alerts")

    __table_args__ = (
        Index("idx_alert_active_type", "machine_id", "alert_type", "is_acknowledged"),
    )

class MaintenanceRecommendation(Base):
    __tablename__ = "maintenance_recommendations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    machine_id = Column(String(50), ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)            # MECHANICAL, THERMAL, LUBRICATION, ELECTRICAL, INSPECTION
    priority = Column(String(20), nullable=False)            # LOW, MEDIUM, HIGH
    action_required = Column(Text, nullable=False)
    rationale = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)

    machine = relationship("Machine", back_populates="recommendations")
