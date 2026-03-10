const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt.utils');

const authService = {

    async login(email, password) {
        const result = await pool.query(
            'SELECT id, nombre, email, password_hash, activo FROM usuarios WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            const error = new Error('Credenciales inválidas');
            error.statusCode = 401;
            throw error;
        }

        const user = result.rows[0];

        if (!user.activo) {
            const error = new Error('Usuario inactivo');
            error.statusCode = 403;
            throw error;
        }
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            const error = new Error('Credenciales inválidas');
            error.statusCode = 401;
            throw error;
        }

        // Generar JWT
        const token = generateToken({
            id: user.id,
            email: user.email,
            nombre: user.nombre
        });

        return {
            usuario: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
            },
            token
        };
    },

    async register(nombre, email, password) {
        // Verificar si el usuario ya existe
        const userExists = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            const error = new Error('El correo electrónico ya está registrado');
            error.statusCode = 400;
            throw error;
        }

        // Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Guardar en la base de datos
        const result = await pool.query(
            'INSERT INTO usuarios (nombre, email, password_hash, activo) VALUES ($1, $2, $3, true) RETURNING id, nombre, email',
            [nombre, email, passwordHash]
        );

        const newUser = result.rows[0];

        // Generar JWT
        const token = generateToken({
            id: newUser.id,
            email: newUser.email,
            nombre: newUser.nombre
        });

        return {
            usuario: newUser,
            token
        };
    },
};

module.exports = authService;
