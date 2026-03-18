const jwt = require('jsonwebtoken');

const login = (req, res) => {
  const { email, password } = req.body;

  if (email === 'registrar@university.edu' && password === 'admin123') {
    const token = jwt.sign({ id: 'registrar123' }, process.env.JWT_SECRET || 'supersecret', {
      expiresIn: '30d'
    });
    res.json({ _id: 'registrar123', email: 'registrar@university.edu', token });
  } else {
    res.status(401).json({ message: 'Invalid credentials. Access denied.' });
  }
};

module.exports = { login };
