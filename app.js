const express = require('express') // Require --> commonJS
const crypto = require('node:crypto')
const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')


const app = express()
app.use(express.json())

app.disable('x-powered-by') // Deshabilitar el header X-Powered-By: Express

// Todos los recursos que sean MOVIES se identifican con /movies
app.get('/movies', (req,res) => {
    res.header('Access-Control-Allow-Origin', '*')
    const { genre } = req.query

    if(genre) {
        const filterMovies = movies.filter(
            // movie => movie.genre.includes(genre) Fallaría con minúscula o todo mayúscula
            movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase()) // De esta forma no hay problema de mayúsculas o minúsculas
        )

        return res.json(filterMovies)
    }

    res.json({movies})
})

// Recuperar la película por ID
app.get('/movies/:id', (req, res) => { // path-to-regexp
    const { id } = req.params // Recuperamos el id como un parámetro de la request
    const movie = movies.find(movie => movie.id === id)
    if(movie) return res.json(movie) // Si encuentra la peli se devuelve
    res.status(404).json({ meesage: 'Movie not found'}) // Si no se devuelve el error
})

app.post('/movies', (req,res) => {

    const result = validateMovie(req.body)

    if(!result.success) {
        // También se podría usar el código 422
        return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const newMovie = {
        id: crypto.randomUUID(),
        ...result.data
    }

    // Esto no sería REST, porque estamos guardando el estado
    // de la aplicación en memoria
    movies.push(newMovie)

    res.status(201).json(newMovie) // Devolvemos el recurso creado para actualizar la caché del cliente
})

app.patch('/movies/:id', (req, res) => {

    const result = validatePartialMovie(req.body)

    if(!result.success)
        return res.status(400).json({ error: JSON.parse(result.error.message)})

    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if (movieIndex === -1) 
        return res.status(404).json({ message: 'Movie not found'})

    const updateMovie = {
        ...movies[movieIndex],
        ...result.data
    }

    movies[movieIndex] = updateMovie

    return res.json(updateMovie)
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
    console.log(`Server listing in port http://localhost:${PORT}`)
})