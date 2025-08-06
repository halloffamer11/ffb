#!/usr/bin/env python3
"""
Alembic Setup Script
Sets up Alembic for database migrations.
"""

import subprocess
import sys
import os

def install_alembic():
    """Install Alembic if not already installed"""
    print("📦 Installing Alembic...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "alembic"], check=True)
        print("✅ Alembic installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install Alembic: {e}")
        return False

def init_alembic():
    """Initialize Alembic"""
    print("\n🚀 Initializing Alembic...")
    try:
        subprocess.run(["alembic", "init", "alembic"], check=True)
        print("✅ Alembic initialized successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to initialize Alembic: {e}")
        return False

def configure_alembic():
    """Configure Alembic for our project"""
    print("\n⚙️  Configuring Alembic...")
    
    # Update alembic.ini
    alembic_ini_content = """[alembic]
script_location = alembic
sqlalchemy.url = sqlite:///./ffb.db

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
"""
    
    try:
        with open("alembic.ini", "w") as f:
            f.write(alembic_ini_content)
        print("✅ Updated alembic.ini")
    except Exception as e:
        print(f"❌ Failed to update alembic.ini: {e}")
        return False
    
    # Update env.py
    env_py_content = '''"""Alembic environment configuration."""
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import sys
import os

# Add the app/backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app', 'backend'))

from models import Base
from database import SQLALCHEMY_DATABASE_URL

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = SQLALCHEMY_DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = SQLALCHEMY_DATABASE_URL
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
'''
    
    try:
        with open("alembic/env.py", "w") as f:
            f.write(env_py_content)
        print("✅ Updated alembic/env.py")
    except Exception as e:
        print(f"❌ Failed to update alembic/env.py: {e}")
        return False
    
    return True

def create_initial_migration():
    """Create initial migration"""
    print("\n📝 Creating initial migration...")
    try:
        subprocess.run(["alembic", "revision", "--autogenerate", "-m", "Initial migration"], check=True)
        print("✅ Initial migration created")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to create initial migration: {e}")
        return False

def run_migration():
    """Run the migration"""
    print("\n🔄 Running migration...")
    try:
        subprocess.run(["alembic", "upgrade", "head"], check=True)
        print("✅ Migration completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to run migration: {e}")
        return False

def main():
    """Set up Alembic for the project"""
    print("🚀 Setting up Alembic for database migrations\n")
    
    steps = [
        ("Install Alembic", install_alembic),
        ("Initialize Alembic", init_alembic),
        ("Configure Alembic", configure_alembic),
        ("Create Initial Migration", create_initial_migration),
        ("Run Migration", run_migration)
    ]
    
    for step_name, step_func in steps:
        if not step_func():
            print(f"\n❌ Failed at step: {step_name}")
            return False
    
    print("\n🎉 Alembic setup completed successfully!")
    print("\n📋 Usage:")
    print("  alembic revision --autogenerate -m 'Description'  # Create new migration")
    print("  alembic upgrade head                              # Apply migrations")
    print("  alembic downgrade -1                              # Rollback one migration")
    print("  alembic current                                   # Show current revision")
    print("  alembic history                                   # Show migration history")
    
    return True

if __name__ == "__main__":
    main()
