pseudo.CstrMem = function() {
    const PSX_EXE_HEADER_SIZE = 0x800;

    return {
        ram: union(0x200000),
        hwr: union(0x4000),

        writeExecutable(data) {
            const header = new Uint32Array(data, 0, PSX_EXE_HEADER_SIZE);
            const offset = header[6];
            cpu.setpc(header[4]);

            const exe = new Uint8Array(data, PSX_EXE_HEADER_SIZE);

            for (let i = 0; i < exe.byteLength; i++) {
                directMemB(mem.ram.ub, offset + i) = exe[i];
            }
        },

        write: {
            w(addr, data) {
                switch(addr >>> 24) {
                    case 0x80:
                        directMemW(mem.ram.uw, addr) = data;
                        return;

                    case 0x1f:
                        switch(addr & 0xffff) {
                            case 0x10a8: // GPU DMA chcr
                                chcr = data;
                                vs.executeDMA(addr);
                                chcr = data & (~(0x01000000));
                                return;
        
                            case 0x1810: // GPU Data
                                vs.writeData(data);
                                return;
                        }
                        directMemW(mem.hwr.uw, addr) = data;
                        return;
                }
            },

            h(addr, data) {
                switch(addr >>> 24) {
                    case 0x80:
                        directMemH(mem.ram.uh, addr) = data;
                        return;
                }
            },

            b(addr, data) {
                switch(addr >>> 24) {
                    case 0x80:
                        directMemB(mem.ram.ub, addr) = data;
                        return;
                }
            },
        },

        read: {
            w(addr) {
                switch(addr >>> 24) {
                    case 0x80:
                        return directMemW(mem.ram.uw, addr);

                    case 0x1f:
                        switch(addr & 0xffff) {
                            case 0x1814: // GPU Status
                                return 0x14802000;
                        }
                        return directMemW(mem.hwr.uw, addr);
                }
            },

            h(addr) {
                switch(addr >>> 24) {
                    case 0x80:
                        return directMemH(mem.ram.uh, addr);
                }
            },

            b(addr) {
                switch(addr >>> 24) {
                    case 0x80:
                        return directMemB(mem.ram.ub, addr);
                }
            },
        }
    };
};

const mem = new pseudo.CstrMem();
