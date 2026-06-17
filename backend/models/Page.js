module.exports = (sequelize, DataTypes) => {
    const Page = sequelize.define(
        'Page',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            page_type: {
                type: DataTypes.STRING(50),
                allowNull: false
            },

            title: {
                type: DataTypes.STRING(255),
                allowNull: false
            },

            content: {
                type: DataTypes.TEXT('long'),
                allowNull: false
            },

            status: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1
            }
        },
        {
            tableName: 'pages',
            underscored: true,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    );

    return Page;
};