export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="app-footer">
            <p>&copy; {currentYear} Minsway Solutions Pvt Ltd</p>
        </footer>
    )
}
